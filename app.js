/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
//var zChat = require('./zopim-web-sdk.js');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// zChat.init({
//     account_key: '5CovnPf4dwlM7U3jaOKzzIOVR1vFT1P6'
// });  

// zChat.on('connection_update', function(status) {
//     session.send("TEST").endDialog();
//     if (status === 'connected') {
//          session.send("TEST").endDialog();
//     }
// });  

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = 'bb5ee332-8ce7-466a-b5d7-46724b99c3b2'; //process.env.LuisAppId;
var luisAPIKey = '861ce67b4a1a4f1bb28c77b8e6d701e6'; //process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

//const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;
const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/032779b4-3116-47d2-999f-f7d53f43b7d2?subscription-key=861ce67b4a1a4f1bb28c77b8e6d701e6&spellCheck=true&verbose=true&timezoneOffset=0&q=';
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .onDefault((session) => {
        session.send('Sorry, I did not understand \'%s\'', session.message.text);
        // var connection_status = zChat.getConnectionStatus();
        // session.send(connection_status);

    });

bot.on('conversationUpdate', function (activity) {
    // when user joins conversation, send welcome message
    if (activity.membersAdded) {
        activity.membersAdded.forEach(function (identity) {
            if (identity.id === activity.address.bot.id) {
                var reply = new builder.Message()
                    .address(activity.address)
                    .text("Hi Lena, knowing what’s best for you always comes with the best rewards. And when you’re a loyal MaxisONE Club member, the rewards will surely keep coming. Yes, we’re all for special treatment. And all good things come in TWOS! Get TWO month free if you register for MaxisONE Home Broadband now. You will also continue to enjoy benefits that are exclusive to you.");
                bot.send(reply);
            }
        });
    }
});

bot.dialog('/', intents);

intents.matches('Intent_Name_dummy', (session) => {
    session.send("Response_dummy").endDialog();
});

intents.matches('OfferQuery', (session) => {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            // .title("Plan")
            .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/maxis_offer.png')])
            .buttons([
                builder.CardAction.imBack(session, "Signup now", "Signup")
            ])
    ]);
    session.send(msg).endDialog();
});

intents.matches('PlanQuery', [
    function (session, args, next) {
        builder.Prompts.choice(session,
            'No worries. Let me help you to personalize your MaxisONE Home Broadband. Do you want MaxisONE Go WiFi?',
            ["Add MaxisONE Go wifi", "No thanks"],
            { listStyle: builder.ListStyle.button });
    }, function (session, results, next) {
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/Light.png')])
                .buttons([
                    builder.CardAction.imBack(session, "Light", "Light")
                ]),
            new builder.HeroCard(session)
                .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/Moderate.png')])
                .buttons([
                    builder.CardAction.imBack(session, "Moderate", "Moderate")
                ]),
            new builder.HeroCard(session)
                .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/Heavy.png')])
                .buttons([
                    builder.CardAction.imBack(session, "Heavy", "Heavy")
                ]),
            new builder.HeroCard(session)
                .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/Extreme.png')])
                .buttons([
                    builder.CardAction.imBack(session, "Extreme", "Extreme")
                ])
        ]);

        builder.Prompts.text(session, msg, { maxRetries: 1 });
    },
    function (session, results, next) {
        builder.Prompts.choice(session,
            'How many people use this connection?',
            ["Less than 2", "Less than 4", "More than 5"],
            { listStyle: builder.ListStyle.button });
    }, function (session, results, next) {
        var msg = new builder.Message(session);
        msg.text("Based on your choices, the best plan for you is the 30 Mbps plan");
        msg.attachmentLayout(builder.AttachmentLayout.carousel)
        msg.attachments([
            new builder.HeroCard(session)
                .title("30_MBPS Plan")
                .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/Plan30Mbps.png')])
                .buttons([
                    builder.CardAction.imBack(session, "Check Availability", "Check Availability", { maxRetries: 1 })
                ])
        ]);
        builder.Prompts.text(session, msg);
    }, function (session, results, next) {
        builder.Prompts.choice(session,
            'Yes, your registered address is covered. Do you want installation at your registered address?',
            ["Yes", "No, I will provide alternate address"],
            { listStyle: builder.ListStyle.button }, { maxRetries: 1 });
    },
    function (session, results, next) {
        // session.send(results.response.entity);
        if (results.response.entity === 'Yes') { next(); }
        else {
            var msg = new builder.Message(session);
            msg.text("Select location from map");
            msg.attachmentLayout(builder.AttachmentLayout.carousel);
            msg.attachments([
                new builder.HeroCard(session)
                    .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/location.png')])
                    .buttons([
                        builder.CardAction.imBack(session, "Select", "Select")
                    ])
            ]);
            builder.Prompts.text(session, msg, { maxRetries: 1 });
        }
    },
    function (session, results, next) {
        //  session.send(results.response.entity);
        if (!results.response) { next(); }
        else {
            var msg = new builder.Message(session);
            msg.text("Great news, you can get MaxisONE Home Broadband! This means you'll enjoy the fastest speed available in your area");
            msg.attachmentLayout(builder.AttachmentLayout.carousel);
            msg.attachments([
                new builder.HeroCard(session)
                    .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/location_confirmation.png')])
                    .buttons([
                        builder.CardAction.imBack(session, "Get It Now!", "Get It Now")
                    ])
            ]);
            // builder.Prompts.text(session, msg, { maxRetries: 1 });
            session.send(msg).endDialog();
        }
    },
    function (session, args, next) {
        builder.Prompts.time(session, "Suggest a suitable first date option for installation (eg: 7th nov)", { maxRetries: 1 });
    }, function (session, args, next) {
        builder.Prompts.time(session, "Suggest a suitable alternate date option for installation (eg: 7th nov)", { maxRetries: 1 });
    }, function (session, results) {
        session.send("Thank you, your request is registered.");
        session.endDialog();
    }
]).endConversationAction("stop",
    "Conversation Closed. Please start over",
    {
        matches: /^cancel$|^goodbye$|^exit|^stop|^close/i
        // confirmPrompt: "This will cancel your order. Are you sure?"
    }
    );

intents.matches('SharedLinePlanAdditionQuery', [
    function (session, args, next) {
        const msg = new builder.Message(session);
        msg.text("At the heart of it, we believe in something simple. We can get you sign up MaxisONE Share right away with your current MaxisONE Plan 188.Refer to our FAQs below. Watch how to share your data across family lines and multiple devices with DataPool here. Enjoy MaxisONE Share Line with 10GB and Unlimited Calls for RM48/mth. You will get 5GB for your DataPool and another 5GB for 4G weekends.");
        msg.addAttachment({ contentType: 'video/mp4', contentUrl: 'https://www.youtube.com/watch?v=D_TM-m4kACY' });// as builder.IAttachment);
        msg.addAttachment({ contentType: 'image/jpeg', contentUrl: 'https://maxisdemoblob.blob.core.windows.net/images/FAQ_Card.png' });// as builder.IAttachment);

        builder.Prompts.text(session, msg, { maxRetries: 1 });
    }, function (session, args, next) {
        builder.Prompts.choice(session,
            'How would you like to collect your SIM card?',
            ["Collect from Maxis Store", "Send to my home"],
            { listStyle: builder.ListStyle.button }, { maxRetries: 1 });
    }, function (session, args, next) {
        builder.Prompts.text(session,
            'Can I confirm activation?');
    }, function (session, args, next) {
        if (args.response === 'yes') {
            //session.beginDialog("lousyspeed");
            builder.Prompts.time(session, "Suggest a suitable first date option for installation (eg: 7th nov).", { maxRetries: 1 });
        } else {
            session.endConversation();
            session.beginDialog("lousyspeed");
        }
    }, function (session, args, next) {
        builder.Prompts.time(session, "Suggest a suitable alternate date option for installation (eg: 7th nov)", { maxRetries: 1 });
    }, function (session, args, next) {
        builder.Prompts.choice(session,
            'Confirm the dates?',
            ["Confirm"],
            { listStyle: builder.ListStyle.button }, { maxRetries: 1 });
    }, function (session, args) {
        session.send("Thank you, your request is registered.");
        session.endDialog();
    }

]).endConversationAction("stop",
    "Conversation Closed. Please start over again",
    {
        matches: /^cancel$|^goodbye$|^exit|^stop|^close/i,
        // confirmPrompt: "This will cancel your progress?"
    }
    );


intents.matches('PlanComparisonQuery', (session) => {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/30mbps_plan_com.png')])
            .buttons([
                builder.CardAction.imBack(session, "availability", "Check availability")
            ]),
        new builder.HeroCard(session)
            .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/30mbps_lite_plan.png')])
            .buttons([
                builder.CardAction.imBack(session, "availability", "Check availability")
            ])
    ]);
    session.send(msg).endDialog();
});

bot.dialog('help', function (session, args, next) {
    //Send a help message
    session.endDialog("Type exit/cancel anytime to leave a conversation");
})
    // Once triggered, will start a new dialog as specified by
    // the 'onSelectAction' option.
    .triggerAction({
        matches: /^help$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the top of the dialog stack 
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    });

bot.dialog('lousyspeed', [
    function (session, args, next) {
        var msg = new builder.Message(session);
        msg.text("Expected Internet speed based on your location is");
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .images([builder.CardImage.create(session, 'https://maxisdemoblob.blob.core.windows.net/images/Speedtest.png')])
                .buttons([
                    builder.CardAction.imBack(session, "Hear it from our Maxperts", "Hear it from our Maxperts"),
                    builder.CardAction.imBack(session, "Hear it from our customers", "Hear it from our customers"),
                    builder.CardAction.imBack(session, "Got It!", "Got It!")

                ])
        ]);
        builder.Prompts.text(session, msg, { maxRetries: 1 });
    }, function (session, args, next) {
        //session.begindialog("lousyspeed");
        builder.Prompts.time(session, "Suggest a suitable first date option for installation (eg: 7th nov)", { maxretries: 1 });

    }, function (session, args, next) {
        builder.Prompts.time(session, "Suggest a suitable alternate date option for installation (eg: 7th nov)", { maxretries: 1 });
    }, function (session, args, next) {
        builder.Prompts.choice(session,
            'confirm the dates?',
            ["confirm"],
            { liststyle: builder.liststyle.button }, { maxretries: 1 });
    }, function (session, args) {
        session.send("thank you, your request is registered.");
        session.enddialog();
    }
]);