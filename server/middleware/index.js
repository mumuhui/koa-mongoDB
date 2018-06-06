import config from '../config/config'
import jwt from 'jsonwebtoken'

/**
 * 中间件 检查token是否失效
 */
async function verify(ctx, next) {
    const {
        URL: {
            pathname
        },
        headers: {
            settoken
        }
    } = ctx.request;
    const isVerify = config.verifyPath.some(item => {
        if (typeof item === 'string') {
            return item === pathname;
        } else if (typeof item === 'object') {
            return !!pathname.match(item)
        }
        return false;
    });
    if (isVerify) {
        let jwtVerify;
        try {
            // console.log(config.secret)         
            jwtVerify = await jwt.verify(settoken, config.secret);
        } catch (err) {
            console.log(err);
            ctx.throw(401, 'JsonWebTokenError', {
                name: 'JsonWebTokenError'
            });
        }
        const {
            id,
            user
        } = jwtVerify;
        if (id) {
            ctx.state = {
                id,
                user
            }
        }
        await next();
    } else {
        await next();
    }
}

/**
 * token异常报错
 */
async function tokenError(ctx, next) {
    await next().catch((err) => {
        if (err.name === 'JsonWebTokenError') {
            ctx.status = 401;
            ctx.body = {
                error: err.originalError ? err.originalError.message : err.message
            };
        } else {
            ctx.status = err.status || 500;
            ctx.body = {
                error: err.originalError ? err.originalError.message : err.message
            };
        }
    });
}

/**
 * error处理
 * @param {*} ctx 
 * @param {*} next 
 */
async function errorHandler(ctx, next) {
    try {
        await next()
    } catch (err) {
        console.log('Server Error', err);
        ctx.response.status = err.statusCode || err.status || 500
        ctx.response.body = {
            message: err.message,
            status: ctx.response.status
        }
    }
}

module.exports = {
    verify,
    tokenError,
    errorHandler
}