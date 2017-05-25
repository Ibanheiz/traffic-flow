function startPulling() {
    keepPulling = true;
    setTimeout(pullJob, 0);

    concurrentPulls = 1;
    duplicates = 0;
    lastPullSuccess = new Date();
}

function pullJob() {
    if (!keepPulling) {
        return;
    }

    fanout();
    executePull();
}

function fanout() {
    const now = Date.now();

    // relaunch additional concurrent requests if they seem to have been successful in the past and within the MAXCONCURRENT limit
    for (let i = 0; concurrentPulls < PUBSUB_MAXCONCURRENT && now - lastPullSuccess < PUBSUB_RETRY_PERIOD; i++) {
        setTimeout(pullJob, 100 * i);
        concurrentPulls++;
    }
}

function executePull() {
    const request = pubsub.projects.subscriptions.pull({
        subscription: PUBSUB_SUBSCRIPTION,
        max_messages: PUBSUB_MAXMESSAGES
    });

    console.log('here 0');

    request.execute(function (response) {
        console.log('here X');

        if (concurrentPulls > 0) {
            concurrentPulls--;
        }

        lastPullSuccess = Date.now();

        if (hasMessages(response)) {
            const messages = parseMessages(response);
            const ackIds = parseAckIds(response);

            ackReceivedMessages(ackIds)
        }
    });
}

function hasMessages(resp) {
    return 'receivedMessages' in resp && resp.receivedMessages.length > 0;
}

function parseMessages(resp) {
    return resp.receivedMessages.map(function (msg) {
        return JSON.parse(window.atob(msg.message.data))
    });
}

function parseAckIds(resp) {
    return resp.receivedMessages.map(function (msg) {
        return msg.ackId
    });
}

function ackReceivedMessages(ackIds) {
    if (ackIds.length <= 0) {
        console.log('here');
        return;
    }

    countDuplicates(ackIds);
    console.log("Received " + ackIds.length + " PubSub messages. Duplicates so far: " + duplicates);

    executeAckRequest(ackIds);
}

function executeAckRequest(ackIds) {
    const request = pubsub.projects.subscriptions.acknowledge({
        subscription: PUBSUB_SUBSCRIPTION,
        ackIds: ackIds
    });

    request.execute(function () {
        if (concurrentPulls < PUBSUB_MAXCONCURRENT) {
            setTimeout(pullJob, 100);
            concurrentPulls++
        }
    })
}

function countDuplicates(ackIds) {
    const now = Date.now();
    ackIds.forEach(function (id) {
        if (id in allAckIds) {
            duplicates++;
        } else {
            allAckIds[id] = now;
        }
    });
}