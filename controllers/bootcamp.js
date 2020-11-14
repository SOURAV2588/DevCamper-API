const path = require('path');
const Bootcamp = require('../models/Bootcamp');
const errorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');


// @desc      Get all bootcamps
// @route      GET /api/v1/bootcamps
// @access     Public 
exports.getBootcamps = asyncHandler( async (req, res, next) =>{
    res.status(200).json(res.advancedResults);
});

// @desc      Get single bootcamps
// @route      GET /api/v1/bootcamps/id
// @access     Public 
exports.getBootcamp = asyncHandler(async (req, res, next) =>{
    const bootcamp = await Bootcamp.findById(req.params.id);
    if(!bootcamp){
      return next(new errorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({ success:true, data: bootcamp });
});

// @desc      Create a new bootcamp
// @route      POST /api/v1/bootcamps
// @access     private 
exports.createBootcamp = asyncHandler( async (req, res, next) =>{
  // Add user to body
  req.body.user = req.user.id;

  // Check for published bootcamps
  const publishedBootcamp = await Bootcamp.findOne({ user : req.user.id});

  // If the user is not admin, they can add only one bootcamp
  if(publishedBootcamp && req.user.role!=='admin'){
    return next(new errorResponse(`User with id ${req.user.id} has already published a bootcamp`, 400));
  }
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({ success : true, data : bootcamp});
});

// @desc       Update a bootcamp
// @route      PUT /api/v1/bootcamps/id
// @access     private 
exports.updateBootcamp = asyncHandler(async (req, res, next) =>{
  let bootcamp = await Bootcamp.findById(req.params.id);
  if(!bootcamp){
    return next(new errorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is bootcamp owner
  if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
    console.log("Role : "+req.user.role);
    return next(new errorResponse(`User ${req.params.id} is not authorized to update `, 404));
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new : true,
    runValidators : true
  });

  res.status(200).json({ success:true, data : bootcamp });
});

// @desc       Delete a bootcamp
// @route      DELETE /api/v1/bootcamps/id
// @access     private 
exports.deleteBootcamp = asyncHandler(async (req, res, next) =>{
  const bootcamp = await Bootcamp.findById(req.params.id);
  if(!bootcamp){
    return next(new errorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
  }

    // Make sure user is bootcamp owner
  if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
    console.log("Role : "+req.user.role);
    return next(new errorResponse(`User ${req.params.id} is not authorized to delete `, 404));
  }

  bootcamp.remove();
  res.status(200).json({ success:true, data : {} });
});

// @desc       Get bootcamps within a radius
// @route      GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access     private 
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) =>{
  const { zipcode, distance } = req.params;

  //get lat/lan from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const long = loc[0].longitude;

  //Calc radius using radians
  // Divide distance by radius of earth
  // Earth radius 3963 mi/ 6378 kms
  const radius = distance/3963;
  const bootcamps = await Bootcamp.find({
    location : { $geoWithin: { $centerSphere: [ [ long , lat ], radius ] } }
  });
  res.status(200).json({
    success : true,
    count : bootcamps.length,
    data : bootcamps
  })
});


// @desc       Upload photo for bootcamp
// @route      DELETE /api/v1/bootcamps/:id/photo
// @access     private 
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) =>{
  const bootcamp = await Bootcamp.findById(req.params.id);
  if(!bootcamp){
    return next(new errorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
  }

    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
      console.log("Role : "+req.user.role);
      return next(new errorResponse(`User ${req.params.id} is not authorized to update `, 404));
    }
 
  if(!req.files){
    return next(new errorResponse(`Please upload a file`, 400));
  }
  const file = req.files.file;

  // Make sure the image is a photo
  if(!file.mimetype.startsWith('image')){
    return next(new errorResponse(`Please upload an image file`, 400));
  }

  if(file.size > process.env.MAX_FILE_UPLOAD){
    return next(new errorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
  }

  // Create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async error => {
    if(error){
      console.error(error);
      return next(new errorResponse(`Problem with file upload`, 500));
    }
    await Bootcamp.findByIdAndUpdate(req.params.id, { photo : file.name});
    res.status(200).json({ success : true, data : file.name });
  });
});