import jwt from "jsonwebtoken";

export const generateToken = (user, res) => {
    console.log('User object passed to generateToken:', user);

    const token = jwt.sign(
        { userId: user.id, username: user.username }, // ✅ username included
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    console.log('Generated Token Payload:', { userId: user.id, username: user.username });

    res.cookie('jwt', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'development'
    });

    return token;
};
