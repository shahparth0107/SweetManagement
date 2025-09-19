const router = require("express").Router();
const { register , login } = require("../controller/authcontroller");

router.post("/register", register);

router.post("/login", login);


module.exports = router;

// const router = require('express').Router();
// // const { register } = require('../controller/authcontroller');

// // TEMP STUB: prove the router is reachable
// router.post('/register', (req, res) => {
//   console.log('hit STUB register route');
//   return res.status(201).json({ ok: true, body: req.body });
// });

// // // Restore after testing
// // router.post('/register', register);

// module.exports = router;
