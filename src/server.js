import app from './app.js';
import config from './config/env.config.js';

app.listen(config.port, () => {
    console.log(`App ejecutando en modo ${config.nodeEnv} - puerto ${config.port}`);
});
