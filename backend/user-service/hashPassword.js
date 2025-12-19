import bcrypt from 'bcrypt';

const password = '123456'; // Your plain password
bcrypt.hash(password, 10).then(hash => {
  console.log('Hashed Password:', hash);
});