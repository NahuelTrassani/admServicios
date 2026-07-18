import dotenv from 'dotenv';
dotenv.config();

const config = {
    port: Number(process.env.PORT) || 8080,
    nodeEnv: process.env.NODE_ENV || 'development',
};

if (!config.port) {
    console.error('Falta PORT en el archivo .env')
    process.exit(1)
}

export default config