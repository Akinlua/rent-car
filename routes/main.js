const express = require('express')
const router = express.Router();
const multer = require('multer');
const User = require('../model/User');

// Configure multer for file uploads

const storage = multer.memoryStorage()
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },  
    fileFilter: (req, file, cb) => {
        const list_of_accepted_type = ['image/jpeg',  'image/png',  'image/gif',  'image/bmp',  'image/tiff',  'image/webp',  'image/svg+xml']
        if(list_of_accepted_type.includes(file.mimetype)){
        cb(null, true)
        } else {
        cb(new Error('Only Images Allowed'), false)
        // cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE_TYPE"), false)
        }
    }
})

const {
    home, about, cars, pricing, contact, rent, postCarPage, postCar, editCarPage, editCar, deleteCar, postRent, singleCar, rented, adminPage, allUsers, search, temp_Form
} = require('../controllers/main')

const {authAdmin, authMiddleware, notAdmin} = require('../middleware/authentication')

router.get('/', home)
router.get('/about', about)
router.get('/car', cars)
router.get('/car/:id', singleCar)
router.get('/pricing', pricing)
router.get('/contact', contact)
router.get('/rent/:id',authMiddleware, notAdmin, rent)
router.get('/post-car',authMiddleware, authAdmin, postCarPage)
router.post('/post-car',authMiddleware, authAdmin, upload.single('file'), postCar)
router.get('/edit-car/:id',authMiddleware, authAdmin,editCarPage)
router.patch('/edit-car/:id',authMiddleware, authAdmin,  upload.single('file'), editCar)
router.delete('/delete-car/:id',authMiddleware, authAdmin, deleteCar)
router.post('/rent/:id',authMiddleware, notAdmin, postRent)
router.get('/rented-cars', authMiddleware, notAdmin, rented)
router.get('/admin', authMiddleware, authAdmin, adminPage)
router.get('/admin/all-users', authMiddleware, authAdmin, allUsers)
router.post('/search',  authMiddleware, authAdmin, search)
router.post('/temp-form', temp_Form)

module.exports = router