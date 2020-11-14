const errorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Review = require('../models/Review');
const Bootcamp = require('../models/Bootcamp');

// @desc       Get all courses
// @route      GET /api/v1/bootcamps/:bootcampId/reviews
// @access     Public 
exports.getReviews = asyncHandler(async (req,res,next) => {
  if (req.params.bootcampId){
    const reviews = await Review.find({bootcamp : req.params.bootcampId});
    return res.status(200).json({success : true, count : reviews.length, data : reviews});
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc       Get single review
// @route      GET /api/v1/reviews/:id
// @access     Public 
exports.getReview = asyncHandler(async (req,res,next) => {
    const review = await Review.findById(req.params.id).populate({
      path : 'bootcamp',
      select : 'name description'
    });

    if(!review){
      return next(new errorResponse(`No review found with id ${req.params.id}`, 400));
   } 
    res.status(200).json({ success : true, data : review});
});

// @desc       Add review
// @route      POST /api/v1/bootcamps/:bootcampId/reviews/:id
// @access     Private 
exports.addReview = asyncHandler(async (req,res,next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if(!bootcamp){
    next(new errorResponse(`No bootcamps found with id ${req.params.bootcampId}`, 404));
  }
  const review = await Review.create(req.body);
  res.status(201).json({ success : true, data : review});
});

// @desc       Update review
// @route      POST /api/v1/reviews/:id
// @access     Private 
exports.updateReview = asyncHandler(async (req,res,next) => {
  let review = await Review.findById(req.params.id);
  if(!review){
    next(new errorResponse(`No review found with id ${req.params.id}`, 404));
  }

  // Make sure review belongs to user
  if(review.user.toString() !== req.user.id && req.user.role !== 'admin'){
    next(new errorResponse(`No authorize to update review`, 401));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    runValidators : true,
    new : true
  });
  res.status(200).json({ success : true, data : review});
});

// @desc       Delete review
// @route      POST /api/v1/reviews/:id
// @access     Private 
exports.deleteReview = asyncHandler(async (req,res,next) => {
  const review = await Review.findById(req.params.id);
  if(!review){
    next(new errorResponse(`No review found with id ${req.params.id}`, 404));
  }

  // Make sure review belongs to user
  if(review.user.toString() !== req.user.id && req.user.role !== 'admin'){
    next(new errorResponse(`No authorize to update review`, 401));
  }

    await review.remove();
  res.status(200).json({ success : true, data : {}});
});