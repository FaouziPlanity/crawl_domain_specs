const moment = require('moment');
const fs = require('fs');
const {spawn} = require('child_process');

const EXCLUDED = [];

const executeCommand = (cmd, args) =>
    new Promise((resolve, reject) => {
        const process = spawn(cmd, args, {shell: true});
        process.on('exit', code => {
            if (code) {
                reject('process finished in error with code' + code);
            } else {
                resolve();
            }
        });
        process.stdout.on('data', (data) => {
            console.error(data.toString());
        });
        process.stderr.on('data', (error) => {
            console.error(error.toString());
        });
    });

const callTW = async () => {
    const specs = fs.readdirSync("./specs/treatwell");
    for (const spec of specs.filter(spec => !EXCLUDED.find(exclud => exclud === spec))) {
        const specName = spec.split('.')[0];
        console.log("running crawl for", specName);
        const payloadFile = `${__dirname}/specs/treatwell/${spec}`;
        const lambdaOutputFile = `${__dirname}/output/${specName}-outfile.json`;

        try {
            await executeCommand('aws', [
                'lambda',
                'invoke',
                '--region',
                '"eu-west-1"',
                '--function-name',
                '"arn:aws:lambda:eu-west-1:637668567762:function:crawlDomain"',
                '--invocation-type',
                'RequestResponse',
                '--payload',
                `"fileb://${payloadFile}"`,
                `"${lambdaOutputFile}"`,
                '--cli-read-timeout',
                '0',
                '--cli-connect-timeout',
                '0'
            ]);
            console.log("success", specName);
        } catch (e) {
            console.error("Error while calling", specName,":", e);
        }
    }
}

const callBksy = async () => {
    const specs = fs.readdirSync("./specs/booksy");
    for (const spec of specs.filter(spec => !EXCLUDED.find(exclud => exclud === spec))) {
        const specName = spec.split('.')[0];
        console.log("running crawl for", specName);
        const payloadFile = `${__dirname}/specs/booksy/${spec}`;
        const lambdaOutputFile = `${__dirname}/output/${specName}-outfile.json`;

        await executeCommand('aws', [
            'lambda',
            'invoke',
            '--region',
            '"eu-west-1"',
            '--function-name',
            '"arn:aws:lambda:eu-west-1:637668567762:function:crawlBksy-ops"',
            '--invocation-type',
            'RequestResponse',
            '--payload',
            `"fileb://${payloadFile}"`,
            `"${lambdaOutputFile}"`,
            '--cli-read-timeout',
            '0',
            '--cli-connect-timeout',
            '0'
        ]);
    }
}

const callKds = async () => {
    const specName = "kalendes";
    console.log("running crawl for", specName);
    const payloadFile = `${__dirname}/specs/kalendes.json`;
    const lambdaOutputFile = `${__dirname}/output/${specName}-outfile.json`;

    await executeCommand('aws', [
        'lambda',
        'invoke',
        '--region',
        '"eu-west-1"',
        '--function-name',
        '"arn:aws:lambda:eu-west-1:637668567762:function:crawlKds-ops"',
        '--invocation-type',
        'RequestResponse',
        '--payload',
        `"fileb://${payloadFile}"`,
        `"${lambdaOutputFile}"`,
        '--cli-read-timeout',
        '0',
        '--cli-connect-timeout',
        '0'
    ]);
}

const callLambdaUntil = async () => {
    await callTW();
    await callBksy();
    await callKds();
};

callLambdaUntil().then(() => {
    process.exit(0);
})
    .catch(e => {
        console.error(e);
        process.exit(1);
    });