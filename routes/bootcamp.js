const express = require('express');
const { getBootcamps,
        getBootcamp,
        createBootcamp,
        updateBootcamp, 
        deleteBootcamp,
        getBootcampsInRadius,
        bootcampPhotoUpload
      } = require('../controllers/bootcamp');

const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middleware/advancedResults');
    
 // Include other resource router
 const courseRouter = require('./courses');
 const reviewRouter = require('./reviews');

  const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

  //re-route into other resource router
  router.use('/:bootcampId/courses', courseRouter);
  router.use('/:bootcampId/reviews', reviewRouter);

  router.route('/radius/:zipcode/:distance')
        .get(getBootcampsInRadius);

  router.route('/:id/photo')
        .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

  router.route('/')
        .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
        .post(protect, authorize('publisher', 'admin'), createBootcamp);

  router.route('/:id')
        .get(getBootcamp)
        .put(protect, authorize('publisher', 'admin'), updateBootcamp)
        .delete(protect, deleteBootcamp);

module.exports = router;