var Task = require("../models/task");
var User = require("../models/user");

module.exports = function(router) {
    const tasksRoute = router.route("/tasks");
    const tasksIdRoute = router.route("/tasks/:id");

    tasksRoute.post(async function (req, res) {
        try {
            const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;

            // Validation: name and deadline are required
            if (!name || !deadline) {
                return res.status(400).json({ message: "Name and deadline are required.", data: {} });
            }

            // Validate assigned user and username consistency if provided
            let validUser = null;
            if (assignedUser) {
                validUser = await User.findById(assignedUser);
                if (!validUser) {
                    return res.status(400).json({ message: "Invalid assignedUser ID.", data: {} });
                }
                if (assignedUserName && assignedUserName !== validUser.name) {
                    return res.status(400).json({ message: "assignedUserName does not match assignedUser ID.", data: {} });
                }
            }

            // Explicitly create a new Task object (no req.body)
            const newTask = new Task({
                name: name,
                description: description || "",
                deadline: deadline,
                completed: completed || false,
                assignedUser: assignedUser || null,
                assignedUserName: assignedUserName || (validUser ? validUser.name : "unassigned"),
            });

            await newTask.save();

            // If task assigned to a valid user and not completed, add to pendingTasks
            if (validUser && !newTask.completed) {
                if (!validUser.pendingTasks.includes(newTask._id)) {
                    validUser.pendingTasks.push(newTask._id);
                    await validUser.save();
                }
            }

            return res.status(201).json({ message: "Task created", data: newTask });
        } catch (error) {
            return res.status(500).json({ message: "Server error", data: error });
        }
    });

    tasksRoute.get(async function (req, res) {
        try {
            const { where, sort, select, skip, limit, count } = req.query;
            let query = Task.find();
            let filter = {};
            // Apply where filter
            if (where) {
                try {
                    filter = JSON.parse(where);
                    query = query.where(filter);
                } catch (error) {
                    return res.status(400).json({ message: "Invalid 'where' parameter JSON", data: {}});
                }
            }

            // Apply sort 
            if (sort) {
                try {
                    const parsedSort = JSON.parse(sort);
                    query = query.sort(parsedSort);
                } catch (error) {
                    return res.status(400).json({ message: "Invalid 'sort' parameter JSON", data: {} });
                }
            }

            // Apply select
            if (select) {
            try {
                const parsedSelect = JSON.parse(select);
                query = query.select(parsedSelect);
            } catch (error) {
                return res.status(400).json({ message: "Invalid 'select' parameter JSON", data: {} });
            }
        }
            // Apply skip for offset pagination
            if (skip) {
                const parseSkip = parseInt(skip, 10);
                if (!isNaN(parseSkip) && parseSkip >= 0) {
                    query = query.skip(parseSkip);
                } else {
                    return res.status(400).json({ message: 'Invalid "skip" parameter.  Must be a non-negative integer.', data: {}});
                }
            }
            // Apply limit
            if (limit) {
                const parsedLimit = limit ? parseInt(limit, 10) : 100;
                if (!isNaN(parsedLimit) && parsedLimit > 0) {
                    query = query.limit(parsedLimit);
                } else {
                    return res.status(400).json({ message: 'Invalid "limit" parameter. Must be a positive integer.', data: {}});
                }
            } 

            // Apply count
            if (count == 'true') {
                const totalCount = await Task.countDocuments(filter);
                return res.status(200).json({ message: "OK", data: totalCount });
            }

            const tasks = await query.exec();
            
            return res.status(200).json({message: "OK", data: tasks});
        } catch (error) {
            return res.status(500).json({ message: "Server error", data:error });
        }
    });
    
    tasksIdRoute.get(async function (req, res) {
        try {
            const selectFields = req.query.select ? JSON.parse(req.query.select) : {};
            const { id } = req.params;
            const task = await Task.findById(id).select(selectFields);

            if (!task)
                return res.status(404).json({ message: "Task not found", data: {} });

            return res.status(200).json({ message: "OK", data: task });
        } catch (error) {
            return res.status(500).json({ message: "Server error", data:error });
        }
    });

    tasksIdRoute.put(async function (req, res) {
        try {
            const { id } = req.params;
            let {
                name,
                description,
                deadline,
                completed,
                assignedUser,
                assignedUserName
            } = req.body;

            const oldTask = await Task.findById(id);
            if (!oldTask) {
                return res.status(404).json({ message: "Task not found", data: {} });
            }

            // Validation: at least name or deadline must be present
            if (!name && !deadline && !description && typeof completed === "undefined" && !assignedUser) {
                return res.status(400).json({ message: "At least one field (name, deadline, etc.) is required to update.", data: {} });
            }

            // Fill missing fields with old values to prevent overwriting with undefined/null
            if (typeof name === "undefined") name = oldTask.name;
            if (typeof description === "undefined") description = oldTask.description;
            if (typeof deadline === "undefined") deadline = oldTask.deadline;
            if (typeof completed === "undefined") completed = oldTask.completed;

            // Validate assignedUser and assignedUserName consistency
            if (assignedUser) {
                const user = await User.findById(assignedUser);
                if (!user) {
                    return res.status(400).json({ message: "Invalid assignedUser ID.", data: {} });
                }
                // Auto-fill assignedUserName if not provided
                if (!assignedUserName) {
                    assignedUserName = user.name;
                } else if (assignedUserName !== user.name) {
                    return res.status(400).json({ message: "assignedUserName does not match assignedUser ID.", data: {} });
                }
            }

            // Remove from old user's pendingTasks if assignedUser changed
            if (oldTask.assignedUser && oldTask.assignedUser.toString() !== assignedUser) {
                const oldUser = await User.findById(oldTask.assignedUser);
                if (oldUser && oldTask.completed === false) {
                    oldUser.pendingTasks = oldUser.pendingTasks.filter(
                        (t) => t.toString() !== id
                    );
                    await oldUser.save();
                }
            }

            // Remove from pendingTasks if task is now completed
            if (completed === true && oldTask.completed === false && oldTask.assignedUser) {
                const user = await User.findById(oldTask.assignedUser);
                if (user) {
                    user.pendingTasks = user.pendingTasks.filter(
                        (t) => t.toString() !== id
                    );
                    await user.save();
                }
            }

            const updatedFields = {
                name,
                description,
                deadline,
                completed,
                assignedUser,
                assignedUserName,
            };

            const updatedTask = await Task.findByIdAndUpdate(
                id,
                updatedFields,
                { new: true, runValidators: true }
            );

            // Add to new user's pendingTasks if needed
            if (assignedUser) {
                const newUser = await User.findById(assignedUser);
                if (newUser && !newUser.pendingTasks.includes(updatedTask._id) && !updatedTask.completed) {
                    newUser.pendingTasks.push(updatedTask._id);
                    await newUser.save();
                }
            }

            return res.status(200).json({ message: "Task updated", data: updatedTask });
        } catch (error) {
            return res.status(500).json({ message: "Server error", data: error });
        }
    });

    tasksIdRoute.delete(async function (req, res) {
        try {
            const { id } = req.params;
            const deletedTask = await Task.findByIdAndDelete(id);
            
            if (!deletedTask)
                return res.status(404).json({ message: "Task not found", data: {} });

            // Remove the task from the assignedUser's pendingTasks list by filtering out the deteledTask Id
            if (deletedTask.assignedUser) {
                const user = await User.findById(deletedTask.assignedUser);
                if (user) {
                    user.pendingTasks = user.pendingTasks.filter(
                        (t) => t.toString() !== deletedTask._id.toString()
                    );
                    await user.save();
                }
            }

            return res.status(200).json({ message: "Task deleted", data: {} });
        } catch (error) {
            return res.status(500).json({ message: "Server error", data:error });
        }
    });
    return router;
};