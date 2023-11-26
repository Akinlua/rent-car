const express = require('express')
const router = express.Router()
// const {authMiddleware, authAdmin} = require('../middleware/authentication.js')


const {loginPage, register, postLogin, postRegister,logout
} = require('../controllers/user')

router.get('/login', loginPage)
router.get('/register', register)
router.post('/login', postLogin)
router.post('/register', postRegister)
router.get('/logout', logout)


module.exports = router
