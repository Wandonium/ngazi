const express = require('express');
const SimCardsCtrl = require('../controllers/simcards.controller.js');

const router = express.Router();

router.route('/').post(SimCardsCtrl.apiPostSimCard);
router.route('/').get(SimCardsCtrl.apiGetSimCards);
router.route('/id/:id').get(SimCardsCtrl.apiGetSimCardsById);
router.route('/').put(SimCardsCtrl.apiUpdateSimCard);
router.route('/id/:id').delete(SimCardsCtrl.apiDeleteSimCard);

module.exports = router;