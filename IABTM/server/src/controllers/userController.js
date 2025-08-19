// import dotenv from "dotenv"
// dotenv.config({
//     path: "./.env"
// })

import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/userModel.js';
import Otp from '../models/otpModel.js';
import bcrypt from 'bcryptjs'
import randomstring from 'randomstring';
import otpGenerator from 'otp-generator';

import sendVerificationEmail from '../helpers/sendEmail.js'
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import uploadOnCloudinary from '../utils/cloudinary.js';
import PendingUser from '../models/pendingUserModel.js';
import sendVerificationSms from '../helpers/sendSms.js';

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV;


export const loginUserWithMail = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt for email:', email);

        if (!email || !password) {
            throw new ApiError(400, "Email and password are required");
        }

        // Add timeout to database query
        const user = await Promise.race([
            User.findOne({ email }).select("+password"),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 10000)
            )
        ]);
        console.log('👤 User found:', user ? 'Yes' : 'No');

        if (!user) {
            throw new ApiError(401, "Invalid email or password");
        }

        console.log('🔑 Comparing passwords...');
        const isPasswordValid = await Promise.race([
            user.comparePassword(password),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Password comparison timeout')), 5000)
            )
        ]);
        console.log('🔑 Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid email or password");
        }

        const accessToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
        const refreshToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

        // Store refresh token in user document
        user.refreshToken = refreshToken;
        await user.save();

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        res.cookie("token", accessToken, { ...options, maxAge: 60 * 60 * 1000 }); // 1 hour
        res.cookie("refreshToken", refreshToken, options);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken").populate({
            path: 'curatedPaths',
            populate: {
                path: 'curatedMedia',
                populate: [
                    { path: 'artMedia' },
                    { path: 'musicMedia' },
                    { path: 'filmMedia' }
                ]
            }
        });

        return res.status(200).json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User logged in successfully")
        );
    } catch (error) {
        // If it's already an ApiError, re-throw it
        if (error.statusCode) {
            throw error;
        }
        
        // Log the actual error for debugging
        console.error('Login error:', error);
        
        // For other errors, throw a generic error
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const registerUserWithNumber = async (req, res) => {
    const { name, phoneNumber, password, role, profilePicture } = req.body;
    if (!name || !phoneNumber || !password || !profilePicture) {
        return res.status(200).json(new ApiResponse(400, null, "All fields are required: name, phone number, password, and profile picture."));
    }

    try {
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(200).json(new ApiResponse(400, null, "User already exists"));
        }
        const existingPendingUser = await PendingUser.findOne({ phoneNumber })

        const otp = randomstring.generate({ length: 5, charset: '123456789' });
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

        if (existingPendingUser) {
            await PendingUser.findOneAndUpdate({ phoneNumber }, { otp, otpExpiration })
            await sendVerificationSms(otp, phoneNumber)
            return res.json(new ApiResponse(200, null, "OTP sent to your number. Please verify your number to complete registration."));
        }
        const newPendingUser = new PendingUser({
            name,
            phoneNumber,
            password,
            role,
            profilePicture,
            otp,
            otpExpiration
        });

        await newPendingUser.save();

        await sendVerificationSms(otp, phoneNumber)

        return res.json(new ApiResponse(200, null, "OTP sent to your number. Please verify your number to complete registration."));

    } catch (error) {
        console.error("Error during registration:", error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const registerUserWithMail = async (req, res) => {
    console.log("req", req.body)

    const { name, email, password, role, profilePicture, attributes, profileName, onboarding, phoneNumber } = req.body;


    if (!validator.isEmail(email)) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid email address"));
    }

    if (password && password.length < 6) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Password must be at least 6 characters long"));
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json(new ApiResponse(400, null, "User already exists"));
        }

        // Check if a pending user exists
        const existingPendingUser = await PendingUser.findOne({ email });
        const otp = randomstring.generate({ length: 5, charset: "123456789" });
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

        if (existingPendingUser) {
            // Update existing pending user
            await PendingUser.findOneAndUpdate(
                { email },
                { otp, otpExpiration, profilePicture, name },
                { new: true }
            );

            await sendVerificationEmail(name, email, otp);
            return res.json(
                new ApiResponse(200, null, "OTP sent to your email. Please verify your email to complete registration.")
            );
        }

        // Create a new pending user
        const newPendingUser = new PendingUser({
            name,
            email,
            password,
            profilePicture,
            phoneNumber,
            role,
            attributes,
            profileName,
            isOnboarded: onboarding,
            otp,
            otpExpiration,
        });

        console.log("newPendingUser", newPendingUser)

        await newPendingUser.save();
        await sendVerificationEmail(name, email, otp);

        return res.json(
            new ApiResponse(200, null, "OTP sent to your email. Please verify your email to complete registration.")
        );
    } catch (error) {
        console.error("Error during registration with email:", error);
        return res.status(500).json(new ApiError(500, "Internal server error", [error.message]));
    }
};

export const loginUserWithNumber = async (req, res) => {
    const { phoneNumber, password } = req.body;

    try {
        if (!phoneNumber || !password) {
            return res.status(200).json(new ApiResponse(400, null, "PhoneNumber and password are required."));
        }

        const user = await User.findOne({ phoneNumber }).select('+password');
        if (!user) {
            return res.status(200).json(new ApiResponse(404, null, "User not found."));
        }

        // Check if user has a password (for users who might have been created without password)
        if (!user.password) {
            return res.status(200).json(new ApiResponse(400, null, "Invalid login method. Please use the correct login method."));
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(200).json(new ApiResponse(400, null, "Invalid password"));
        }

        if (user.twoFA) {
            const existingPendingOtp = await Otp.findOne({ phoneNumber })

            const otp = randomstring.generate({ length: 5, charset: '123456789' });
            const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

            if (existingPendingOtp) {
                await Otp.findOneAndUpdate({ phoneNumber }, { otp, otpExpiration })
                await sendVerificationSms(otp, phoneNumber)
                return res.json(new ApiResponse(200, null, "OTP sent to your number. Please verify your number to complete registration."));
            }

            const newOtp = new Otp({
                phoneNumber,
                otp,
                otpExpiration
            })

            await newOtp.save()

            await sendVerificationSms(otp, phoneNumber)
            return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify to complete login."));
        }

        const accessToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
        const refreshToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

        // Store refresh token in user document
        user.refreshToken = refreshToken;
        await user.save();

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        res.cookie("token", accessToken, { ...options, maxAge: 60 * 60 * 1000 }); // 1 hour
        res.cookie("refreshToken", refreshToken, options);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken").populate({
            path: 'curatedPaths',
            populate: {
                path: 'curatedMedia',
                populate: [
                    { path: 'artMedia' },
                    { path: 'musicMedia' },
                    { path: 'filmMedia' }
                ]
            }
        });

        return res.json(new ApiResponse(200, {
            user: loggedInUser,
            accessToken,
            refreshToken
        }, "Login successful."));
    } catch (error) {
        console.error("Error during login with email:", error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const verifyUserNumber = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(200).json(new ApiResponse(400, null, "PhoneNumber and otp are required."));
    }

    try {
        const user = await User.findOne({ phoneNumber });

        if (user) {
            const pendingOtp = await Otp.findOne({ phoneNumber });

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingOtp.otpExpiration);
            if (String(otp) !== String(pendingOtp.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
            }

            await Otp.findOneAndDelete({ phoneNumber })

            const accessToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
            const refreshToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

            // Store refresh token in user document
            user.refreshToken = refreshToken;
            await user.save();

            const options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            };

            res.cookie("token", accessToken, { ...options, maxAge: 60 * 60 * 1000 }); // 1 hour
            res.cookie("refreshToken", refreshToken, options);

            return res.json(new ApiResponse(200, {
                user,
                accessToken,
                refreshToken
            }, "Login successful"));
        } else {
            const pendingUser = await PendingUser.findOne({ phoneNumber });

            if (!pendingUser) {
                return res.status(200).json(new ApiResponse(400, null, "Pending registration not found"));
            }

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingUser.otpExpiration);

            if (String(otp) !== String(pendingUser.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
            }

            const newUser = new User({
                name: pendingUser.name,
                phoneNumber: pendingUser.phoneNumber,
                password: pendingUser.password,
                profilePicture: pendingUser.profilePicture,
                role: "user"
            });

            await newUser.save();

            await PendingUser.deleteOne({ phoneNumber });

            const accessToken = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
            const refreshToken = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

            // Store refresh token in user document
            newUser.refreshToken = refreshToken;
            await newUser.save();

            const options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            };

            res.cookie("token", accessToken, { ...options, maxAge: 60 * 60 * 1000 }); // 1 hour
            res.cookie("refreshToken", refreshToken, options);

            return res.json(new ApiResponse(201, {
                user: newUser,
                accessToken,
                refreshToken
            }, "User registered and logged in successfully"));
        }

    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const verifyUserEmail = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(200).json(new ApiResponse(400, null, "Email and OTP are required"));
    }

    try {
        const user = await User.findOne({ email });

        if (user) {
            const pendingOtp = await Otp.findOne({ email });

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingOtp.otpExpiration);
            if (String(otp) !== String(pendingOtp.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
            }

            await Otp.findOneAndDelete({ email })

            const accessToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
            const refreshToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

            // Store refresh token in user document
            user.refreshToken = refreshToken;
            await user.save();

            const options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            };

            res.cookie("token", accessToken, { ...options, maxAge: 60 * 60 * 1000 }); // 1 hour
            res.cookie("refreshToken", refreshToken, options);

            return res.json(new ApiResponse(200, user, "Login successful"));
        } else {
            const pendingUser = await PendingUser.findOne({ email });

            if (!pendingUser) {
                return res.status(200).json(new ApiResponse(400, null, "Pending registration not found"));
            }

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingUser.otpExpiration);

            if (String(otp) !== String(pendingUser.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
            }

            console.log("pendingUser in verification", pendingUser)

            const newUser = new User({
                name: pendingUser.name,
                email: pendingUser.email,
                password: pendingUser.password,
                profilePicture: pendingUser.profilePicture,
                profileName: pendingUser.profileName,
                attributes: pendingUser.attributes,
                phoneNumber: pendingUser.phoneNumber,
                isOnboarded: pendingUser.isOnboarded,
                emailVerified: true,
                role: pendingUser.role,
            });

            await newUser.save();

            console.log("newUser", newUser)

            await PendingUser.deleteOne({ email });

            // --- Begin: Create personalized path after user creation ---
            try {
                // Import the personalized path controller
                const { createPersonlisedPath } = await import('./createPersonalisedPathController.js');
                // Simulate req/res for internal call
                const fakeReq = { user: { id: newUser._id }, body: { attributes: newUser.attributes } };
                const fakeRes = {
                    status: () => ({ json: () => {} }),
                    json: () => {}
                };
                await createPersonlisedPath(fakeReq, fakeRes);
            } catch (err) {
                console.error('Error creating personalized path after onboarding:', err);
            }
            // --- End: Create personalized path after user creation ---

            // Fetch updated user profile with populated curatedPaths and media
            const updatedUser = await User.findById(newUser._id).populate({
                path: 'curatedPaths',
                populate: {
                    path: 'curatedMedia',
                    populate: [
                        { path: 'artMedia' },
                        { path: 'musicMedia' },
                        { path: 'filmMedia' }
                    ]
                }
            });

            const accessToken = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
            const refreshToken = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

            // Store refresh token in user document
            newUser.refreshToken = refreshToken;
            await newUser.save();

            const options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            };

            res.cookie("token", accessToken, { ...options, maxAge: 60 * 60 * 1000 }); // 1 hour
            res.cookie("refreshToken", refreshToken, options);

            return res.json(new ApiResponse(201, updatedUser, "User registered, personalized path created, and logged in successfully"));
        }

    } catch (error) {
        console.error('Error in OTP verification and user processing:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const forgetPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(200).json(new ApiResponse(400, null, "Email is required"));
    }

    try {
        const isUser = await User.findOne({ email });

        if (!isUser) {
            return res.status(200).json(new ApiResponse(400, null, "User with this email address not found"));
        }
        const existingPendingUser = await PendingUser.findOne({ email })

        const otp = randomstring.generate({ length: 5, charset: '123456789' });
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
        if (existingPendingUser) {
            await PendingUser.findOneAndUpdate({ email }, { otp, otpExpiration })
            await sendVerificationEmail(isUser.name, email, otp);
            return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify your email to reset your password"));
        }
        const newPendingUser = new PendingUser({
            email,
            otp,
            otpExpiration
        });

        await newPendingUser.save();
        await sendVerificationEmail(isUser.name, email, otp);

        return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify your email to reset your password"));
    } catch (error) {
        console.error("Error during registration with email:", error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const resetPassword = async (req, res) => {

    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    try {

        const pendingOtp = await PendingUser.findOne({ email });

        const currentTime = new Date();
        const otpExpirationDate = new Date(pendingOtp.otpExpiration);
        if (String(otp) !== String(pendingOtp.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
            return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
        }

        user.password = newPassword
        await user.save()

        await PendingUser.findOneAndDelete({ email })

        const accessToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
        const refreshToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

        // Store refresh token in user document
        user.refreshToken = refreshToken;
        await user.save();

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        res.cookie("token", accessToken, { ...options, maxAge: 60 * 60 * 1000 }); // 1 hour
        res.cookie("refreshToken", refreshToken, options);

        return res.json(new ApiResponse(200, null, "Password changed successfully"));

    }
    catch (error) {
        console.error('Error saving the new password:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const logout = async (req, res) => {
    try {
        // Clear refresh token from user document if user is authenticated
        if (req.user && req.user.id) {
            await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: 1 } });
        }

        // Clear all authentication-related cookies
        res.clearCookie("token");
        res.clearCookie("authToken");
        res.clearCookie("refreshToken");
        res.clearCookie("session");
        
        // Set additional security headers
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.json(new ApiResponse(200, null, "Logged out successfully"));
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json(new ApiResponse(500, null, "Logout failed"));
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        console.log('req body', req.body);

        let userId = req.user.role !== "superAdmin" ? req.user.id : req.params.id;

        const updates = {};
        const allowedUpdates = ['name', 'profileName', 'age', 'gender', 'email', 'phoneNumber', 'profilePicture'];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { runValidators: true, new: true } 
        ).populate({
            path: 'curatedPaths',
            populate: {
                path: 'curatedMedia',
                populate: [
                    { path: 'artMedia' },
                    { path: 'musicMedia' },
                    { path: 'filmMedia' }
                ]
            }
        });

        console.log("updatedUser", updatedUser);

        if (!updatedUser) {
            return res.status(200).json(new ApiResponse(400, null, "User not found"));
        }

        return res.status(200).json(new ApiResponse(200, updatedUser, "User Profile updated successfully"));
    } catch (error) {
        console.error('Error updating profile:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const deleteUserProfile = async (req, res) => {
    try {
        let userId;

        if (req.user && req.user.role !== "superAdmin") {
            userId = req.user.id;
        } else {
            userId = req.params.id;
        }

        if (!userId) {
            return res.status(400).json(new ApiResponse(400, null, "User ID is required"));
        }

        const deleteUser = await User.findOneAndDelete({ _id: userId });

        if (!deleteUser) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        return res.status(200).json(new ApiResponse(200, deleteUser, "User deleted successfully"));
    } catch (error) {
        console.error('Error deleting user profile:', error);
        return res.status(500).json(new ApiError(500, "Internal server error", [error.message]));
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate({
            path: 'curatedPaths',
            populate: {
                path: 'curatedMedia',
                populate: [
                    { path: 'artMedia' },
                    { path: 'musicMedia' },
                    { path: 'filmMedia' }
                ]
            }
        });

        // console.log("user", user)

        if (!user) {
            return res.status(200).json(new ApiResponse(400, null, "User not found"));
        }

        return res.status(200).json(new ApiResponse(200, user, "User profile fetched successfully"));
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        console.log('🔍 Server-side: getAllUsers called for user:', currentUserId);

        // First, let's check if there are any users in the database
        const totalUsers = await User.countDocuments();
        console.log('📊 Server-side: Total users in database:', totalUsers);

        const users = await User.find({ _id: { $ne: currentUserId } })
            .select('_id name profilePicture isOnline updatedAt');

        console.log('📦 Server-side: Found users (excluding current user):', users.length);

        if (users.length === 0) {
            console.log('⚠️ Server-side: No users found (excluding current user)');
            return res.status(200).json(new ApiResponse(404, [], "No users found"));
        }

        // Transform _id to _id (keep original field name) and add isOnline/lastSeen
        const formattedUsers = users.map(user => ({
            _id: user._id,
            name: user.name,
            profilePicture: user.profilePicture,
            isOnline: user.isOnline,
            lastSeen: user.isOnline ? null : user.updatedAt
        }));

        console.log('✅ Server-side: Returning formatted users:', formattedUsers.length);
        console.log('📋 Server-side: User names:', formattedUsers.map(u => u.name));

        return res.status(200).json(new ApiResponse(200, formattedUsers, "Users fetched successfully"));
    } catch (error) {
        console.error('❌ Server-side: Error fetching users:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        // Validate userId parameter
        if (!userId || userId === 'undefined' || userId === 'null') {
            return res.status(400).json(new ApiResponse(400, null, "Valid user ID is required"));
        }

        // Validate ObjectId format
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid user ID format"));
        }

        // Don't allow users to fetch their own profile through this endpoint
        if (userId === currentUserId) {
            return res.status(200).json(new ApiResponse(400, null, "Use /me/profile to get your own profile"));
        }

        const user = await User.findById(userId)
            .select('_id name profilePicture isOnline updatedAt');

        if (!user) {
            return res.status(200).json(new ApiResponse(404, null, "User not found"));
        }

        const formattedUser = {
            _id: user._id,
            name: user.name,
            profilePicture: user.profilePicture,
            isOnline: user.isOnline,
            lastSeen: user.isOnline ? null : user.updatedAt
        };

        return res.status(200).json(new ApiResponse(200, formattedUser, "User fetched successfully"));
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const updateUserPathDay = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(200).json(new ApiResponse(401, null, "User is not authenticated"));
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $inc: { pathDay: 1 } },
            { new: true }
        ).populate({
            path: 'curatedPaths',
            populate: {
                path: 'curatedMedia',
                populate: [
                    { path: 'artMedia' },
                    { path: 'musicMedia' },
                    { path: 'filmMedia' }
                ]
            }
        });;

        return res.status(200).json(new ApiResponse(200, updatedUser, "Path day updated successfully"));
    } catch (error) {
        console.error('Error updating path day:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
}

export const searchUsersByName = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json(new ApiResponse(400, null, "Name query parameter is required"));
        }

        const currentUserId = req.user.id;

        const users = await User.find({
            _id: { $ne: currentUserId }, 
            name: { $regex: name, $options: 'i' }
        }).select('_id name profilePicture');

        if (users.length === 0) {
            return res.status(200).json(new ApiResponse(404, [], "No users found with that name"));
        }

        // Transform _id to id
        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            profilePicture: user.profilePicture
        }));

        return res.status(200).json(new ApiResponse(200, formattedUsers, "Users found"));
    } catch (error) {
        console.error('Error searching users by name:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const getUserPreferences = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).select('mutedGroups chatBackgrounds');
        
        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        const preferences = {
            mutedGroups: user.mutedGroups || [],
            chatBackgrounds: user.chatBackgrounds || {}
        };

        return res.json(new ApiResponse(200, { preferences }, "User preferences retrieved successfully"));
    } catch (error) {
        console.error("Error getting user preferences:", error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            throw new ApiError(401, "Refresh token is required");
        }

        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const accessToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "1h" });

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000 // 1 hour
        };

        res.cookie("token", accessToken, options);

        return res.status(200).json(
            new ApiResponse(200, {
                accessToken
            }, "Access token refreshed successfully")
        );
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Refresh token expired");
        }
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};
