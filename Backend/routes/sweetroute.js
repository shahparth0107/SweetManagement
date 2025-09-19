const router = require("express").Router();
const {createSweet, getSweets, updateSweet, deleteSweet , searchSweet, purchaseSweet, restockSweet} = require("../controller/sweetcontroller");
const auth = require("../middlewear/auth");
const requireAdmin = require("../middlewear/requireAdmin");

router.post("/createSweet", auth, requireAdmin, createSweet);
router.get("/getSweets", getSweets);
router.put("/updateSweet/:id", auth, requireAdmin, updateSweet);
router.delete("/deleteSweet/:id", auth, requireAdmin, deleteSweet);
router.get("/searchSweet", searchSweet);


router.post("/:id/purchase", auth, purchaseSweet);
router.post("/:id/restock", auth, requireAdmin, restockSweet);

module.exports = router;