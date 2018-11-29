const User = require('../src/user');
const Thread = require('../src/thread');
const Comment = require('../src/comment');
const ApiErrors = require('../model/apiErrors');
const jsonModel = require('../model/JsonResponseModel');
const comment = require('./commentRepo');

module.exports = class StudditThread {

    static getSingleThread(id, res) {
        let singleThreadArray = [];
        let commentArray = [];
        let replyArray = [];

        User.find().populate({
            path: "threads",
            populate: {
                path: "comments",
                model: "comment"
            }
        })
            .then((users) => {
                for (let user of users) {
                    if (user.threads) {
                        for (let thread of user.threads) {
                            if (thread.id == id) {
                                singleThreadArray.push({
                                    "_id": thread.id,
                                    "title": thread.title,
                                    "content": thread.content,
                                    "upvotes": thread.upvotes.length,
                                    "downvotes": thread.downvotes.length,
                                    "createdBy": user.username
                                });
                                res.status(200).json({"thread": singleThreadArray, "comments": thread.comments});
                            }
                        }
                    } else {
                        res.status(422).json(new jsonModel("/api/threads", "GET", 422, "Thread does not exist"));
                    }
                }
            })
            .catch(() => {
                res.status(404).json(ApiErrors.notFound());
            });
    }

    static getAllThreads(res) {
        let threadArray = [];
        User.find().populate("threads")
            .then((users) => {
                for (let user of users) {
                    if (user.threads) {
                        for (let thread of user.threads) {
                            threadArray.push({
                                "_id": thread.id,
                                "title": thread.title,
                                "content": thread.content,
                                "upvotes": thread.upvotes.length,
                                "downvotes": thread.downvotes.length,
                                "createdBy": user.username
                            })
                        }
                    }
                }
                res.status(200).json({"threads": threadArray});
            })
            .catch(() => {
                res.status(404).json(ApiErrors.notFound());
            });
    }

    static createThread(title, content, usernameParam, res) {
        let myUser = User;
        myUser.findOne({ username: usernameParam })
            .then((user) => {
                if (user !== null && user !== undefined) {
                    const newThread = new Thread({
                        title: title,
                        content: content
                    });

                    user.threads.push(newThread);
                    Promise.all([user.save(), newThread.save()])
                        .then(() => {
                            res.status(201).json(new jsonModel("/api/threads", "POST", 201, "The thread has been succesfully created."));
                        })
                        .catch(() => {
                            res.status(500).json(ApiErrors.internalServerError());
                        })
                } else {
                    res.status(404).json(new jsonModel("/api/threads", "POST", 400, "Username can't be empty"));
                }
            })
            .catch(() => {
                res.status(422).json(new jsonModel("/api/threads", "POST", 422, "User " + usernameParam + " does not exist"));
            })
    };

    static updateThread(id, newContent, res) {
        let myThread = Thread;
        myThread.findOne({ _id: id.toString() })
            .then((thread) => {
                thread.set({ content: newContent });
                thread.save();
            }).then(() => {
            res.status(200).json(new jsonModel("/api/threads", "PUT", 200, "The thread has been succesfully updated."));
        })
            .catch(() => {
                res.status(500).json(ApiErrors.internalServerError());
            }).catch(() => {
            res.status(422).json(new jsonModel("/api/threads", "PUT", 422, "Thread " + id + " does not exist"));
        })
    };

    static deleteThread(id, username, res) {
        let myThread = Thread;
        myThread.findOne({ _id: id })
            .then((thread) => {
                if (thread) {
                    thread.remove()
                        .then(() => {
                            User.findOneAndUpdate({ username }, { $pull: { "threads": id } })
                                .then(() => {
                                    comment.deleteCommentsFromThread(id);
                                })
                                .catch(() => {
                                    res.status(500).json(ApiErrors.internalServerError());
                                })
                        });
                res.status(200).json(new jsonModel("/api/threads/" + id, "DELETE", 200, "Thread removed"))
                } else {
                    res.status(404).json(new jsonModel("/api/threads/" + id, "DELETE", 422, "Thread does not exist"));
                }
            })
            .catch(() => {
                res.status(404).json(new jsonModel("/api/threads/" + id, "DELETE", 422, "Thread does not exist"));
            })
    }

};