/**
 * Configuration file. You may try to enable other DSTAT plugins, most of them must to work.
 * Don't enable plugins that starts with "--top-*".
 *
 * You can read man of DSTAT at https://github.com/dagwieers/dstat
 *
 * Use {env: key} to specify environment variables. DSTAT uses this variables for connection to
 * MySQL, Mongodb and others. You cant open any plugin file in "/usr/share/dstat/" directory
 * to see if some plugin need environment variables to be set.
 *
 * You need to have write permission to be able to run this server because of pipe that
 * are used as buffer between DSTAT and server.
 *
 * @type {{dataBuffer: string, env: {}, plugins: string[], port: number, debug: boolean, delay: number}}
 */
module.exports = {
    dataBuffer : "dstat_pipe",
    env: {
        DSTAT_MYSQL_USER: 'root',
        DSTAT_MYSQL_PWD: 'root'
    },
    plugins: ['--redis',  '--mongodb-cmds', '--mysql5-cmds', '--mysql5-conn', '--mysql5-io', '--mysql5-keys', '--cpu', '-C,0,3,total', '--mem', '--page', '--fs', '--disk', '--disk-util', '--socket', '--net', '-N', 'lo,total'],
    port: 3016,
    debug: false,
    delay: 1
};

/**
 Tested plugins that works well:
 plugins:
 [
 '--redis',
 '--mongodb-cmds',
 '--mysql5-cmds',
 '--mysql5-conn',
 '--mysql5-io',
 '--mysql5-keys',
 '--cpu', '-C,0,3,total',
 '--mem',
 '--proc',
 '--page',
 '--fs',
 '--disk',
 '--disk-util',
 '--socket',
 '--net', -N lo,total'
 ]
 */