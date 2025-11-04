const User = require("../models/user");
const Task = require("../models/task");


module.exports = function(router) {
    const usersRoute = router.route("/users");
    const usersIdRoute = router.route("/users/:id");

    usersRoute.post(async function (req, res) {
        try {
            const { name, email, pendingTasks } = req.body;

            // Validation on name and email 
            if (!name || !email) {
                return res.status(400).json({ message: "Name and email are required.", data: {} })
            }

            // Check duplicate emails
            const existingEmail = await User.findOne({ email: email });
            if (existingEmail) {
                return res.status(400).json({ message: "A user with that email already exists.", data: {}})
            }

            // Create a new user
            const newUser = new User({
                name,
                email,
                pendingTasks: []   // optional, since default is []
                });
            await newUser.save();
            return res.status(201).json({ message: "User created", data: newUser });
        } catch (error) {
            return res.status(500).json({ message: "Server error", data: error });
        }
    });

    usersRoute.get(async function (req, res) {
        try {
            const { where, sort, select, skip, limit, count } = req.query;
            let query = User.find();
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
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit) && parsedLimit > 0) {
                    query = query.limit(parsedLimit);
                } else {
                    return res.status(400).json({ message: 'Invalid "limit" parameter. Must be a positive integer.', data: {}});
                }
            } 

            // Apply count
            if (count == 'true') {
                const totalCount = await User.countDocuments(filter);
                return res.status(200).json({ message: "OK", data: totalCount });
            }

            const users = await query.exec();
            
            return res.status(200).json({
                message: "OK",
                data: users,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Server error", data: error });
        }
    });
    // UserId -- get
    usersIdRoute.get(async function (req, res) {
        try {
            const selectFields = req.query.select ? JSON.parse(req.query.select) : {};
            const { id } = req.params; 
            const user = await User.findById(id).select(selectFields);

            if (!user)
                return res.status(404).json({ message: "User not found", data: {} });
            
            return res.status(200).json({ message: "OK", data: user });
        } catch (error) {
            return res.status(500).json({ message: "Server error", data: error });
        }
    });

    // UserId -- Update 
    usersIdRoute.put(async function (req, res) {
        try {
            const { id } = req.params;
            const { name, email, pendingTasks } = req.body;

            if (!name || !email) {
                return res.status(400).json({ message: "Name and email are required.", data: {} })
            }

            // Validate all pendingTasks IDs before updating
            if (pendingTasks && pendingTasks.length > 0) {
                const validTasks = await Task.find({ _id: { $in: pendingTasks } });
                if (validTasks.length !== pendingTasks.length) {
                    return res.status(400).json({
                        message: "One or more pendingTasks IDs are invalid.",
                        data: {},
                    });
                }
            }

            const updatedFields = { name, email, pendingTasks };
            const updatedUser = await User.findByIdAndUpdate(id, updatedFields, { new: true, runValidators: true });

            if (!updatedUser)
                return res.status(404).json({ message: "User not found", data: {} });
            
            return res.status(200).json({ message: "User updated", data: updatedUser });
        } catch (error) {
            return res.status(500).json({ message: "Server error", data: error });
        }
    });

    usersIdRoute.delete(async function (req, res) {
        try {
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);
            
            if (!deletedUser) {
                return res.status(404).json({ message: "User not found", data: {} });
            }
            // Update all tasks assigned to this user
            await Task.updateMany(
            { assignedUser: deletedUser._id },
            { $set: { assignedUser: null, assignedUserName: null } } 
        );

        return res.status(200).json({ message: "User deleted", data: {} });
        } catch (error) {
            return res.status(500).json({ message: "Server error", data:error });
        }
    });
    return router;
};