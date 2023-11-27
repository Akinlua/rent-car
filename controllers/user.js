const noLayout = '../views/layouts/nothing.ejs'
const express = require('express')

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../model/User')
const jwtSecret = process.env.JWT_SECRET
const nodemailer = require('nodemailer')
const mongoose = require('mongoose')

// const {authMiddleware} = require('../middleware/authentication.js')
// const {allDash, deleteFile} = require('./main')
// const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const loginPage = async (req, res) => {

    const token = req.cookies.token;
    if (token) {
        return res.redirect('/')
    }
    let error_ = ''
// Save the referer (the page the user came from) in the session
    req.session.prevPage =req.get('referer')  || '/';

    res.render('user/login', {layout: noLayout, error: error_})
}

const register = async (req, res) => {
    const token = req.cookies.token;
    if (token) {
        return res.redirect('/')
    }

    let error_ = ''
    res.render('user/register', {layout: noLayout, error: error_})
}

const postRegister = async (req,res) => {

    try {
        const {username, password, email} = req.body
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({username, password: hashedPassword, email})
        const token =  await jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
        res.cookie('token', token, {httpOnly: true})

        // if(user.admin){
        //     return res.redirect('/admin')
        // } else {    
        //     return res.redirect('/user-items')
        // }
    
        res.redirect('/')
    }  catch (error) {

        let error_ = "Username or Email already Exists"
        return res.render('user/register', {layout: noLayout, error: error_})
    } 
}


const postLogin = async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    const user = await User.findOne({username})

    let error = ""
    if(!user) {
        error = "Invalid credentials"
        return res.render('user/login', {layout: noLayout, error})
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if(!isPasswordValid) {
        error = "Invalid credentials"
        return res.render('user/login', {layout: noLayout, error})
    }

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
    res.cookie('token', token, {httpOnly: true})

    // if(user.admin){
    //     return res.redirect('/admin')
    // } else {    
    //     return res.redirect('/user-items')
    // }

    const redirectUrl = req.session.referer || req.session.prevPage || '/';
    res.redirect(redirectUrl)
}


const logout = async (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
}

module.exports = {
    loginPage,register,
    postLogin, postRegister,
    logout
}