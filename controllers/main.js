//return if true side note

const noLayout = '../views/layouts/nothing.ejs' 
const navLayout = '../views/layouts/nav.ejs'
const adminLayout = '../views/layouts/admin.ejs'
const jwt = require('jsonwebtoken')
const User = require('../model/User')
const Car = require('../model/car')
const {pagination, isDateWithinRange, isTimeWithinRange, addDaysToDate, addHoursToTime, getDate, changeToInt} = require('../middleware/helper')
const Form = require('../model/Form')
const {auth} = require('../middleware/authentication')

const jwtSecret = process.env.JWT_SECRET

const stripeSecretkey = process.env.STRIPE_SECRET_KEY
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const stripe = require('stripe')(stripeSecretkey);


const CheckAuth = async (req, res) => {

    let is_user = false
    let is_admin = false
    try{
        const token = req.cookies.token;
        if(token) {
            is_user = true
            const decoded = jwt.verify(token, jwtSecret);
            //dont just find by Id, but by password
            const user = await User.findById(decoded.userId)
            if(user) {
                if(user.admin == true) is_admin = true
            }
        }
        return {is_user: is_user, is_admin}
    }  catch (error) {
        console.log(error)
        if(error instanceof jwt.JsonWebTokenError){
            res.clearCookie('token');
            return res.redirect('/login')
        }
        return {is_user: false, is_admin}
    }

}

const home = async (req, res) => {

    const {is_user, is_admin } = await CheckAuth(req, res)

    // get latest 3 cars
    const cars = await Car.find({}).sort('-createdAt').limit(5)

    res.render('home', {
        is_admin, is_user,
        title: "Home",
        layout: navLayout,
        stripePublickey,
        cars
    })
}

const about = async (req, res) => {

    const {is_user, is_admin } = await CheckAuth(req, res)

    res.render('about', {
        is_admin, is_user,
        title: "About",
        layout: navLayout,
        stripePublickey
    })
}

const cars = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)
    let result = Car.find({})
    result = result.sort('-createdAt')
    const count = await Car.find({}).count()
    const {modelinstances, hasNextPage, nextPage, prevPage, hasPrevPage, page, noOfPages, startPoint, endPoint} = await pagination(result,count, req, res)
    const cars = await modelinstances
    let error = ""
    if(req.query.error) error = req.query.error

    //get user
    const userId = await auth(req, res)
    const user = await User.findById(userId)

    res.render('cars', {
        is_admin, is_user,
        title: "Cars",
        layout: navLayout,
        stripePublickey, cars,
        hasNextPage, nextPage, prevPage, 
        hasPrevPage, page, noOfPages, 
        startPoint, endPoint,error, user
    })
}

const singleCar = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)

    const {id} = req.params
    const car = await Car.findById(id)
    if(!car){
        return res.render("error-404", {layout: noLayout})
    } 

    const cars = await Car.find({})

    res.render('car-single', {
        is_admin, is_user,
        title: `${car.name}`,
        layout: navLayout,
        stripePublickey, car, cars
    })
}

const rented = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)


    const form = await Form.find({nameId: req.userId}).sort('-createdAt')

    for (const f of form){

        let save = {}
        const car = await Car.findOne({_id: f.carId})
        save['car_name'] = car.name
        save['pic_path'] = car.pic_path
        save['car_description'] = car.description
        const check = await Object.assign(f,save)
    }


    res.render('rented', {
        is_admin, is_user,
        title: "Rented Cars",
        layout: navLayout,
        stripePublickey, form
    })
}

const pricing = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)

    const cars = await Car.find({}).sort('-createdAt')
    res.render('pricing', {
        is_admin, is_user,
        title: "Pricing",
        layout: navLayout,
        stripePublickey,cars
    })
}

const contact = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)

    res.render('contact', {
        is_admin, is_user,
        title: "Contact",
        layout: navLayout,
        stripePublickey
    })
}

const rent = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)

    const {id} = req.params
    const car = await Car.findById(id)
    if(!car){
        return res.render("error-404", {layout: noLayout})
    }

    let error, pickup_loc, type, type_rate, pickup_date, dropoff_loc, pickup_time = ""

    if(req.session.formData){
        const storedData = req.session.formData
        pickup_loc = storedData.pickup_loc
        type = storedData.type
        type_rate = storedData.type_rate
        pickup_date = storedData.pickup_date
        dropoff_loc = storedData.dropoff_loc
        pickup_time = storedData.pickup_time
        delete req.session.formData;
    }
    
    if(req.query.typeR) type = req.query.typeR
    if(req.query.type) type = req.query.type
    if(req.query.pickup_loc) pickup_loc = req.query.pickup_loc
    if(req.query.type_rate) type_rate = req.query.type_rate
    if(req.query.dropoff_loc) dropoff_loc = req.query.dropoff_loc

    res.render('rent', {
        is_admin, is_user,
        title: "Rent",
        layout: navLayout,
        stripePublickey, car,error, 
        pickup_loc, type, type_rate, 
        pickup_date, dropoff_loc, pickup_time
    })
}

const postRent = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)

    let {pickup_loc, type, type_rate, pickup_date, dropoff_loc, pickup_time, token} = req.body

    const {id} = req.params
    const car = await Car.findById(id)
    if(!car){
        return res.render("error-404", {layout: noLayout})
    }

    if(!token){
        let error = "Make sure to fill in the card details"
        return res.render('rent', {
            is_admin, is_user,
            title: "Rent",
            layout: navLayout,
            stripePublickey, car,error: error, 
            pickup_loc, type, type_rate, 
            pickup_date, dropoff_loc, pickup_time
        })
    }
    try {
        if(type_rate < 1) {
            let error = "Length of use can't be less than 1"
            return res.render('rent', {
                is_admin, is_user,
                title: "Rent",
                layout: navLayout,
                stripePublickey, car,error: error, 
                pickup_loc, type, type_rate, 
                pickup_date, dropoff_loc, pickup_time
            })
        }

        //convert to integer
        type_rate = Math.floor(type_rate)

        var picked = false
        var picked_error = "Pick up date Taken"
        //check if pickup_date pciked 

        // find all form lease and check if the inputted date is present within 30days of the form_leases pickup date
        const form_lease = await Form.find({carId: id, type: "lease"})
        for(const form of form_lease){
            let new_pickupt_date = pickup_date
            let new_type_rate = type_rate
            if(type == "lease") new_type_rate = 30 * type_rate
            if(type == "hourly") new_type_rate = 0
            //check each day or month
            for (let index = 0; index <= new_type_rate ; index++) {
                const check_range = await isDateWithinRange(new_pickupt_date, form.pickup_date, form.type_rate, 30)
                if(check_range == true) {
                    picked = true
                    picked_error = "The pickup date is not available right now, pick another date"
                }
                new_pickupt_date = await addDaysToDate(new_pickupt_date, 1)
            }            
        }
        console.log(picked)

        // find all form that has type daily and date same as inputted one
        const form_daily = await Form.find({carId: id, type: "daily"})
        for(const form of form_daily){
            let new_pickupt_date = pickup_date
            let new_type_rate = type_rate
            if(type == "lease") new_type_rate = 30 * type_rate
            if(type == "hourly") new_type_rate = 0
            if(type == "daily") new_type_rate = type_rate - 1

            for (let index = 0; index <= new_type_rate ; index++) {
                const check_range = await isDateWithinRange(new_pickupt_date, form.pickup_date, form.type_rate-1, 1)
                if(check_range == true) {
                    picked = true
                    picked_error = "The pickup date is not available right now, pick another date"
                }
                new_pickupt_date = await addDaysToDate(new_pickupt_date, 1)
            }
        }
        console.log(picked)

        if(type == "daily" || type == 'lease'){
            let new_pickupt_date = pickup_date
            let new_type_rate = type_rate
            if(type == "lease") new_type_rate = 30 * type_rate
            if(type == "daily") new_type_rate = type_rate - 1

            for (let index = 0; index <= new_type_rate ; index++) {
                const form_hourly = await Form.find({carId: id, type: "hourly", pickup_date: new_pickupt_date})
                if(form_hourly.length > 0){
                    picked = true
                    picked_error = `The pickup date is not available right now for '${type}' type`
                }
                new_pickupt_date = await addDaysToDate(new_pickupt_date, 1)
            }
        }        

        // for hourly find the any form that is also hourly and has same pickup date and check for the availabilty of the pickupt time compared to the ones already in the form
        if(type == 'hourly'){
            const form_hourly = await Form.find({carId: id, type: "hourly", pickup_date: pickup_date})
            for(const form of form_hourly){
                let new_pickup_time = pickup_time
                for (let index = 0; index <= type_rate ; index++) {
                    const check = await isTimeWithinRange(new_pickup_time, form.pickup_time, form.type_rate)
                    if(check== true) {
                        picked = true
                        picked_error = "The pickup time is not available right now, pick another time"
                    }
                    new_pickup_time = await addHoursToTime(new_pickup_time, 1)
                }
            }
        }
        console.log(picked)

        if(picked == true) {
            // send error message
            return res.render('rent', {
                is_admin, is_user,
                title: "Rent",
                layout: navLayout,
                stripePublickey, car,error: picked_error, 
                pickup_loc, type, type_rate, 
                pickup_date, dropoff_loc, pickup_time
            })
        }

        const user = await User.findById(req.userId)

        // set drop off date and time and total charge

        let dropffDate, dropOffTime, total_charge;
        if(type == 'daily'){
            dropffDate = await addDaysToDate(pickup_date, type_rate-1)
            dropOffTime = "00;00"
            total_charge = car.price_per_day * type_rate
        }

        if(type == 'lease'){
            dropffDate = await addDaysToDate(pickup_date, 30 * type_rate)
            dropOffTime = "00:00"
            total_charge = car.price_per_lease * type_rate
        }

        if(type == 'hourly'){
            dropffDate = await addDaysToDate(pickup_date, 0)
            dropOffTime = await addHoursToTime(pickup_time, type_rate)
            total_charge = car.price_per_hour * type_rate
        }

        //get date
        const date = await getDate()


        // make payment
        total_charge = total_charge * 100
        const charge = await stripe.charges.create({
            amount: total_charge,
            currency: 'USD',
            source: token,
            description: `Charge $${total_charge/100} for renting ${car.name}`,
            receipt_email: user.email,
            metadata: {
                name: user.username,
            },
        });

        if(charge.paid == true & charge.status == 'succeeded'){
             //create form / submit
            const form = await Form.create({
                name: user.username,
                nameId: user._id,
                carId: id,
                pickup_loc,
                dropoff_loc,
                type,
                type_rate,
                pickup_date,
                dropoff_date: dropffDate,
                pickup_time,
                dropoff_time: dropOffTime,
                total_charge: total_charge,
                paid: true, chargeId: charge.id,
                receiptUrl: charge.receipt_url,
                date: date,
                car: car.name
            })
        } else {
            return res.render('rent', {
                is_admin, is_user,
                title: "Rent",
                layout: navLayout,
                stripePublickey, car,error: 'Payment Failed', 
                pickup_loc, type, type_rate, 
                pickup_date, dropoff_loc, pickup_time
            })
        }

        res.redirect('/rented-cars')

    } catch(error) {
        console.log(error)
        var error_ = "Error: Fill All details correctly"
        if(error.name === 'ValidationError'){
            var msg = Object.values(error.errors).map((item) => item.message).join(',')
            error_ = msg
        }
        return res.render('rent', {
            is_admin, is_user,
            title: "Rent",
            layout: navLayout,
            stripePublickey, car,error: error_, 
            pickup_loc, type, type_rate, 
            pickup_date, dropoff_loc, pickup_time
        })
    }

}

const postCarPage = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)

    var error, name, company, price_hr, price_day, price_lease, transmission, seats, mileage, fuel, features, description = ""
    res.render('post-car', {
        is_admin, is_user,
        title: "Post Car",
        layout: navLayout,
        stripePublickey, error,
        name, company, price_hr, 
        price_day, price_lease, 
        transmission, seats, mileage, 
        fuel, features, description
    })
}

const postCar = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)
    var {name, company, price_hr, price_day, price_lease, transmission, seats, mileage, fuel, features, description} = req.body

    try{
        if(!req.file){
            var error = "Make sure to upload the neccessary files"
            return  res.render('post-car',{error: error,
                layout: navLayout,
                title: "Post Car",
                is_user, is_admin, stripePublickey,
                name, company, price_hr, price_day, 
                price_lease, transmission, 
                seats, mileage, fuel, features, description
            })
        }

        if(price_day < 0) price_day = price_day * -1
        if(price_hr < 0) price_hr = price_hr * -1
        if(price_lease < 0) price_day = price_lease * -1

        // Access the uploaded file details
        const { originalname, buffer, mimetype } = req.file;
        const image_url = `data:${mimetype};base64,${buffer.toString('base64')}`;

        // save features to list
        const featuresList = features.split(',');

        const car = await Car.create({
            name, company, price_per_hour: price_hr,
            price_per_day: price_day, 
            price_per_lease: price_lease,
            transmission, seats, mileage,fuel, 
            features: featuresList, description, 
            pic_originalname: originalname,
            pic_path: image_url
        })


        res.redirect('/car')
    } catch (error) {
        console.log(error)
        var error_ = "Error: Fill All details correctly"
        if(error.name === 'ValidationError'){
            var msg = Object.values(error.errors).map((item) => item.message).join(',')
            error_ = msg
        }
        return  res.render('post-car',{error: error_,
            layout: navLayout,
            title: "Post Car",
            is_user, is_admin, stripePublickey,
            name, company, price_hr, price_day, 
            price_lease, transmission, 
            seats, mileage, fuel, features, description
        })
    }

}

const editCarPage = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)

    const {id} = req.params

    const car = await Car.findById(id)
    if(!car){
        return res.render("error-404", {layout: noLayout})
    }

    var error, name, company, price_hr, price_day, price_lease, transmission, seats, mileage, fuel, features, description = ""
    res.render('edit-car', {
        is_admin, is_user,
        title: "Edit Car",
        layout: navLayout,
        stripePublickey, error, car,
        name, company, price_hr, price_day, 
        price_lease, transmission, seats, 
        mileage, fuel, features, description
    })
}

const editCar = async (req, res) => {
    const {is_user, is_admin } = await CheckAuth(req, res)

    const {id} = req.params

    const car = await Car.findById(id)
    if(!car){
        return res.render("error-404", {layout: noLayout})
    }

    var {name, company, price_hr, price_day, price_lease, transmission, seats, mileage, fuel, features, description} = req.body

    try{
        
        if(price_day < 0) price_day = price_day * -1
        if(price_hr < 0) price_hr = price_hr * -1
        if(price_lease < 0) price_day = price_lease * -1

        let originalname_ = car.pic_originalname
        let image_url = car.pic_path
        if(req.file){
             // Access the uploaded file details
            const { originalname, buffer, mimetype } = req.file;
            originalname_ = originalname
            image_url = `data:${mimetype};base64,${buffer.toString('base64')}`;
        }

        // save features to list
        const featuresList = features.split(',');

        //update
        const car_ = await Car.findOneAndUpdate({_id: id},{
            name, company, price_per_hour: price_hr,
            price_per_day: price_day, 
            price_per_lease: price_lease,
            transmission, seats, mileage,fuel, 
            features: featuresList, description, 
            pic_originalname: originalname_,
            pic_path: image_url
        },{runValidators: true, new: true})

        res.redirect('/car')
    } catch (error) {
        console.log(error)
        var error_ = "Error: Fill All details correctly"
        if(error.name === 'ValidationError'){
            var msg = Object.values(error.errors).map((item) => item.message).join(',')
            error_ = msg
        }
        return  res.render('edit-car',{error: error_,
            layout: navLayout,
            title: "Edit Car",
            is_user, is_admin, stripePublickey,
            name, company, price_hr, price_day, 
            price_lease, transmission, 
            seats, mileage, fuel, features, description, car
        })
    }

}

const deleteCar = async (req, res) => {
    const {id} = req.params

    const car = await Car.findById(id)
    if(!car){
        return res.render("error-404", {layout: noLayout})
    }

    await Car.deleteOne({_id: id})
    res.redirect('/car#cars_')
}

const adminPage = async (req, res) => {

    const user = await User.findById(req.userId)
    let forms;
    if(req.query.search) {
        let search = req.query.search
        let searchValue = await changeToInt(search)
        let result = await Form.find({
            $or: [
                {name: {$regex: search, $options: 'i'}},
                {car: {$regex: search, $options: 'i'}},
                {pickup_loc: {$regex: search, $options: 'i'}},
                {dropoff_loc: {$regex: search, $options: 'i'}},
                {type: {$regex: search, $options: 'i'}},
                {dropoff_date: {$regex: search, $options: 'i'}},
                {pickup_date: {$regex: search, $options: 'i'}},
                {dropoff_time: {$regex: search, $options: 'i'}},
                {pickup_time: {$regex: search, $options: 'i'}},
                {date: {$regex: search, $options: 'i'}},
                {type_rate: searchValue},
                {total_charge: searchValue},
            ]
        }).sort('-createdAt')
        forms = result
    } else {
        let result = await Form.find({}).sort('-createdAt')
        forms = result
    }

    res.render('admin/index', {
        title: "Admin",
        layout: adminLayout,forms, user
    })
}

const search = async (req, res) => {
    const {search} = req.body
    res.redirect(`/admin?search=${search}`)
}

const allUsers = async (req, res) => {
    const user = await User.findById(req.userId)
    const users = await User.find({})

    res.render('admin/users', {
        title: "Users Page",
        layout: adminLayout,users, user
    })
}

const temp_Form = async ( req, res) => {
    const {pickup_loc, type, type_rate, pickup_date, dropoff_loc, pickup_time,} = req.body;

    // Store the data in the session
    req.session.formData = {pickup_loc, type, type_rate, pickup_date, dropoff_loc, pickup_time,};

    // console.log(req.session.formData)

    res.redirect('/car')
  
}
module.exports ={
    home, about, cars, pricing, contact, 
    rent,postCarPage,postCar, editCarPage,
    editCar, deleteCar, postRent,singleCar, rented,
    adminPage, search, allUsers, temp_Form
}