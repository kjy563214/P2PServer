
const port = 3000;

const databaseConfig = {
    host: 'localhost',
    user: 'root',
    password: '123',
    port: '3306',
    database: 'p2pdatabase',
    connectionLimit: 500
};

const privateKeyPath = './privatekey.pem';
const certificatePath = './certificate.pem';

const pidLength = 6;

module.exports.port = port;
module.exports.databaseConfig = databaseConfig;
module.exports.privateKeyPath = privateKeyPath;
module.exports.certificatePath = certificatePath;
module.exports.pidLength = pidLength;