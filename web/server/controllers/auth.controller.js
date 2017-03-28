import jwt from 'jsonwebtoken';
import async from 'async';
import httpStatus from 'http-status';
import _ from 'lodash';
import Promise from 'bluebird';

import config from '../../config/env';
import emailer from '../../config/email';
import APIError from '../helpers/api.error';
import models from '../models';


function register(req, res, next) {
  let data = {
    username: req.body.username.toLowerCase(),
    password: req.body.password,
    email: req.body.email.toLowerCase()
  };

  let DEFAULT_GROUP = 'Default';
  let DEFAULT_ROLE = 'Default';

  return Promise.resolve(data)
    .then(() => {
      return models.User.existsUsername(data.username); // check username
    })
    .then((existsUsername) => {
      if (existsUsername) {
        const err = new APIError('User already exists', httpStatus.BAD_REQUEST);
        return Promise.reject(err);
      }
      return models.User.existsEmail(data.email);
    })
    .then((existsEmail) => {
      if (existsEmail) {
        const err = new APIError('User already exists', httpStatus.BAD_REQUEST);
        return Promise.reject(err);
      }
      return models.User.encryptPassword(data.password);
    })
    .then((hashedPassword) => {
      if (hashedPassword) {
        data.hash = hashedPassword;

        return models.Group.findByName(DEFAULT_GROUP); // 
      } else {
        const err = new APIError('Invalid password', httpStatus.BAD_REQUEST);
        return Promise.reject(err);
      }
    })
    .then((group) => {
      if (!group) {
        let group = {
          name: DEFAULT_GROUP,
          search: [DEFAULT_GROUP]
        };

        return models.Group.create(group);
      } else {
        return group;
      }
    })
    .then((group) => {
      data.group = group;
      return models.Role.findByName(DEFAULT_ROLE);
    })
    .then((role) => {
      if (!role) {
        let role = {
          name: DEFAULT_ROLE,
          search: [DEFAULT_ROLE]
        };

        return models.Role.create(role);
      } else {
        return role;
      }
    })
    .then((role) => {
      data.role = role;

      let user = {
        username: data.username,
        email: data.email,
        password: data.hash,
        isActive: true,
        groups: [data.group],
        roles: [data.role],
        search: [
          data.username,
          data.email
        ]
      };

      return models.User.create(user);
    })
    .then((user) => {
      data.user = user;
      data.group.users.push(user);
      return models.Group.findOneAndUpdate({
        name: DEFAULT_GROUP
      }, {
        users: data.group.users
      });
    })
    .then((group) => {
      let loginUrl = `${req.protocol}://${req.headers.host}/${config.auth.loginUrl}`;

      let mailOptions = {
        from: `${config.smtp.from.name}<${config.smtp.from.address}>`,
        to: `${data.email}`,
        replyTo: `${config.smtp.from.address}`,
        subject: `[${config.project.name}] Congratulations! You are ready to experiment`,
        text: `Welcome to ${config.project.name}

Thanks for signing up. Your account has been created and you are ready to experiment. 

Here are your login details:
Username: ${data.username}
Email: ${data.email}
Password: same as used while signup

Login: ${loginUrl}

Thanks,
${config.project.organization}`, // plain text body
        // html: `<b>Hello world ?</b>` // html body  //todo
      };

      return emailer.sendMail(mailOptions);
    })
    .then((info) => {
      const token = jwt.sign({
        id: data.user._id
      }, config.auth.jwtSecret);

      return res.json({
        token,
        user: data.user
      });
    })
    .catch(function(error) {
      const err = new APIError(error.message, httpStatus.BAD_REQUEST);
      return next(err);
    });
}

function login(req, res, next) {
  let data = {
    username: req.body.username.toLowerCase(),
    password: req.body.password
  };

  return Promise.resolve(data)
    .then(() => {
      if (_.includes(data.username, '@')) { //email
        return models.User.getByEmail(data.username);
      } else {
        return models.User.getByUsername(data.username);
      }
    })
    .then((user) => {
      data.user = user;
      return models.User.validatePassword(data.password, user.password);
    })
    .then((isValid) => {
      if (isValid) {
        return data.user;
      } else {
        const err = new APIError('Invalid authentication credentials', httpStatus.BAD_REQUEST);
        return Promise.reject(err);
      }
    })
    .then((user) => {
      const token = jwt.sign({
        id: data.user._id
      }, config.auth.jwtSecret);

      return res.json({
        token,
        user: data.user
      });
    })
    .catch(function(error) {
      const err = new APIError(error.message, httpStatus.BAD_REQUEST);
      return next(err);
    });
}


function logout(req, res, next) {
  req.logout();

  return res.json({
    "message": "SUCCESS"
  });
}


function forgotPassword(req, res, next) {
  let data = {
    email: req.body.email.toLowerCase()
  };

  return Promise.resolve(data)
    .then(() => {
      return models.User.getByEmail(data.email);
    })
    .then((user) => {
      data.user = user;
      return models.User.generateResetToken();
    })
    .then((token) => {
      if (token) {
        data.resetPassword = {
          token: token,
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days valid
        };

        return data;
      } else {
        const err = new APIError('Failed to generate reset token', httpStatus.BAD_REQUEST);
        return Promise.reject(err);
      }
    })
    .then(() => {
      let search = {
        email: data.email
      };
      let update = {
        resetPassword: data.resetPassword
      };

      return models.User.findOneAndUpdate(search, update);
    })
    .then((user) => {
      let resetPasswordUrl = `${req.protocol}://${req.headers.host}/${config.auth.resetPasswordUrl}`;

      let mailOptions = {
        from: `${config.smtp.from.name}<${config.smtp.from.address}>`,
        to: `${data.email}`,
        replyTo: `${config.smtp.from.address}`,
        subject: `[${config.project.name}] Reset your login credentials`,
        text: `We received a request for your account to reset the password.
Please ignore the email if you did not raise the request. 

To reset your password, click on the link below or browse the link in your browser.
Reset Password: ${resetPasswordUrl}

Thanks,
${config.project.organization}`, // plain text body
        // html: `<b>Hello world ?</b>` // html body  //todo
      };

      return emailer.sendMail(mailOptions);
    })
    .then((info) => {
      return res.json(data.resetPassword);
    })
    .catch((error) => {
      const err = new APIError(error.message, httpStatus.BAD_REQUEST);
      return next(err);
    });
}

function resetPassword(req, res, next) {
  let data = {
    email: req.body.email.toLowerCase(),
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    token: req.body.token
  };

  return Promise.resolve(data)
    .then(() => {
      if (data.password != data.confirmPassword) {
        return Promise.reject('Passwords do not match')
      } else {
        let search = {
          email: data.email,
          'resetPassword.expiresAt': {
            $gt: Date.now()
          }
        }

        return models.User.findOne(search);
      }
    })
    .then((user) => {
      if (user) {
        data.user = user;
        return data.token == user.resetPassword.token;
      } else {
        const err = new APIError('Invalid credentials', httpStatus.BAD_REQUEST);
        return Promise.reject(err);
      }
    })
    .then((isTokenValid) => {
      if (isTokenValid) {
        return models.User.encryptPassword(data.password);
      } else {
        const err = new APIError('Invalid token', httpStatus.BAD_REQUEST);
        return Promise.reject(err);
      }
    })
    .then((hashedPassword) => {
      let update = {
        password: hashedPassword,
        resetPassword: {
          token: '',
          expiresAt: null
        }
      };

      return models.User.findByIdAndUpdate(data.user._id, update);
    })
    .then((user) => {
      if (user) {
        data.user = user;

        let loginUrl = `${req.protocol}://${req.headers.host}/${config.auth.loginUrl}`;

        let mailOptions = {
          from: `${config.smtp.from.name}<${config.smtp.from.address}>`,
          to: `${data.email}`,
          replyTo: `${config.smtp.from.address}`,
          subject: `[${config.project.name}] Your login credentials are updated`,
          text: `Your login credentials were updated successfully.
If you did not reset the credentials, please reply to this email and we will get in touch to resolve the issue. 

Please use your new credentials to login to the system.
Login here: ${loginUrl}

Thanks,
${config.project.organization}`, // plain text body
          // html: `<b>Hello world ?</b>` // html body  //todo
        };

        return emailer.sendMail(mailOptions);
      } else {
        const err = new APIError('Invalid credentials', httpStatus.BAD_REQUEST);
        return next(err);
      }
    })
    .then((info) => {
      return res.json(data.user);
    })
    .catch(function(error) {
      const err = new APIError(error.message, httpStatus.BAD_REQUEST);
      return next(err);
    });
}

export default {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
};