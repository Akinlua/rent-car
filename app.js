require('dotenv').config()
require('express-async-errors');
const express = require('express')
const expressLayout = require('express-ejs-layouts')

const bodyParser = require('body-parser')
const connectDB = require('./db/connect')
const mainRouter = require('./routes/main')
const userRouter = require('./routes/user')
const methodOverride = require('method-override')
// const {authMiddleware} = require('./middleware/authentication.js')
const {isDateWithinRange, isTimeWithinRange, addDaysToDate, addHoursToTime} = require('./middleware/helper')

const cookieParser = require('cookie-parser')

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');
const app = express()

app.use(bodyParser.json())


app.use(expressLayout)
app.set('layout', './layouts/index')
app.set('view engine', 'ejs')
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))

app.use(express.static('public'))
app.use('', userRouter)
app.use('', mainRouter)

//error handler
app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);







const port = process.env.PORT || 3000


const start = async () => {
    try{
        //connect DB
        // const check = await addDaysToDate('11/21/2023', 1)
        const check = await addHoursToTime('13:00', 1)
        const check2 = await addHoursToTime(check, 1)
        
        console.log(check, check2)
        await connectDB()
        console.log("Connected to DB")
        app.listen(port, "0.0.0.0", console.log(`Server is listening to port ${port}`))
    } catch (error) {
        console.log(error)
    }
}

start();
