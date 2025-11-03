var Task = require("../models/task");
var User = require("../models/user");

module.exports = function(router) {
    const tasksRoute = router.route("/tasks");
    const tasksIdRoute = router.route("/tasks/:id");

    tasksRoute.post(async function (req, res) {
        try {
            const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;

            // Validation on name
            if (!name || !deadline) {
                return res.status(400).json({ message: "Name and deadline are required.", data: {} })
            }

            // const existing = await Task.findOne({ name: name, assignedUser: assignedUser });
            // if (existing){
            //     return res.status(400).json({ message: "The same task has been assigned to the same user.", data: {}});
            // }

            // Create a new task
            const newTask = await Task.create(req.body);

            // If the task is assigned to a user, update that user's pendingTasks
            if (assignedUser) {
                const user = await User.findById(assignedUser);
                if (user && !user.pendingTasks.includes(newTask._id) && !newTask.completed) {
                    user.pendingTasks.push(newTask._id);
                    await user.save();
                }
            }

            return res.status(201).json({ message: "Task created", data: newTask });
        } catch(error) {
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

    // Update 
    tasksIdRoute.put(async function (req, res) {
        try {
            const { id } = req.params;
            const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;

            if (!name || !deadline) {
                return res.status(400).json({ message: "Task name and deadline are required.", data: {} })
            }

            const oldTask = await Task.findById(id);
            if(!oldTask) {
                return res.status(404).json({ message: "Task not found", data: {} });
            }
            //If the assignedUser changes, update both sides
            if (oldTask.assignedUser && oldTask.assignedUser.toString() !== assignedUser) {
                const oldUser = await User.findById(oldTask.assignedUser);
                
                //Only assign not complete task to pendingTask
                if (oldUser && oldTask.completed == false) {
                    oldUser.pendingTasks = oldUser.pendingTasks.filter (
                        (t) => t.toString() !== id
                    );
                    await oldUser.save();
                }
            }

            const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true, runValidators: true});
            // Add this task to the new user's pendingTasks
            if (assignedUser) {
                const newUser = await User.findById(assignedUser);
                if (newUser && !newUser.pendingTasks.includes(updatedTask._id) && !updatedTask.completed){
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

            return res.status(204).json({ message: "Task deleted", data: {} });
        } catch (error) {
            return res.status(500).json({ message: "Server error", data:error });
        }
    });
    return router;
};