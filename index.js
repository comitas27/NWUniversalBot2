var restify = require('restify');
var builder = require('botbuilder');
var prompts = require('./prompts/prompts');
var sendgrid = require('sendgrid')(process.env.sendmailuser,process.env.sendmailpw);
var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=2d23c0dc-82ce-4bfc-9389-268c77b9f35f&subscription-key=15e8122385d5418d8ab35172d076e307');
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
var calling = require('botbuilder-calling');



//=========================================================
// Bot Setup
//=========================================================


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Create calling bot
var connectorVoice = new calling.CallConnector({
    callbackUrl: 'https://nwuniversalbot2.azurewebsites.net/api/calls',
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var botVoice = new calling.UniversalCallBot(connectorVoice);
server.post('/api/calls', connectorVoice.listen());

// This connector line should switch the skype bot to webchat bot... 
//var connectorWeb = new builder.ConsoleConnector().listen();
 

//=========================================================
// Voice Bot Dialogs
//=========================================================

// Root menu
botVoice.dialog('/', [
    function (session) {
        // Send a greeting and start the menu.
        if (!session.userData.welcomed) {
            session.userData.welcomed = true;
            session.send(prompts.helpMessage);
            session.beginDialog('/Menu', { full: true });
        } else {
            session.send(prompts.welcomeBack);
            session.beginDialog('/Menu', { full: false });
        }
    },
    function (session, results) {
        // Always say goodbye
        session.send(prompts.goodbye);
    }
]);

botVoice.dialog('/Menu', [
    function (session, args) {
        // Build up a stack of prompts to play
        var list = [];
        list.push(calling.Prompt.text(session, prompts.Menu.prompt));
        if (!args || args.full) {
            list.push(calling.Prompt.text(session, prompts.Menu.choices));
            list.push(calling.Prompt.text(session, prompts.Menu.help));
        }

        // Prompt user to select a menu option
        calling.Prompts.choice(session, new calling.PlayPromptAction(session).prompts(list), [
            { name: 'dtmf', speechVariation: ['dtmf'] },
            { name: 'digits', speechVariation: ['digits'] },
            { name: 'record', speechVariation: ['record', 'recordings'] },
            { name: 'chat', speechVariation: ['chat', 'chat message'] },
            { name: 'choices', speechVariation: ['choices', 'options', 'list'] },
            { name: 'help', speechVariation: ['help', 'repeat'] },
            { name: 'quit', speechVariation: ['quit', 'end call', 'hangup', 'goodbye'] }
        ]);
    },
    function (session, results) {
        if (results.response) {
            switch (results.response.entity) {
                case 'choices':
                    session.send(prompts.Menu.choices);
                    session.replaceDialog('/Menu', { full: false });
                    break;
                case 'help':
                    session.replaceDialog('/Menu', { full: true });
                    break;
                case 'quit':
                    session.endDialog();
                    break;
                default:
                    // Start demo
                    session.beginDialog('/' + results.response.entity);
                    break;
            }
        } else {
            // Exit the menu
            session.endDialog(prompts.canceled);
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/Menu', { full: false });
    }
]);

botVoice.dialog('/dtmf', [
    function (session) {
        session.send(prompts.dtmf.intro);
        calling.Prompts.choice(session, prompts.dtmf.prompt, [
            { name: 'option A', dtmfVariation: '1' },
            { name: 'option B', dtmfVariation: '2' },
            { name: 'option C', dtmfVariation: '3' }
        ]);
    },
    function (session, results) {
        if (results.response) {
            session.endDialog(prompts.dtmf.result, results.response.entity);
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);

botVoice.dialog('/digits', [
    function (session, args) {
        if (!args || args.full) {
            session.send(prompts.digits.intro);
        }
        calling.Prompts.digits(session, prompts.digits.prompt, 10, { stopTones: '#' });
    },
    function (session, results) {
        if (results.response) {
            // Confirm the users account is valid length otherwise reprompt.
            if (results.response.length >= 5) {
                var prompt = calling.PlayPromptAction.text(session, prompts.digits.confirm, results.response);
                calling.Prompts.confirm(session, prompt, results.response);
            } else {
                session.send(prompts.digits.inavlid);
                session.replaceDialog('/digits', { full: false });
            }
        } else {
            session.endDialog(prompts.canceled);
        }
    },
    function (session, results) {
        if (results.resumed == calling.ResumeReason.completed) {
            if (results.response) {
                session.endDialog();
            } else {
                session.replaceDialog('/digits', { full: false });
            }
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);

botVoice.dialog('/record', [
    function (session) {
        session.send(prompts.record.intro);
        calling.Prompts.record(session, prompts.record.prompt, { playBeep: true });
    },
    function (session, results) {
        if (results.response) {
            session.endDialog(prompts.record.result, results.response.lengthOfRecordingInSecs);
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);

// Import botbuilder core library and setup chat bot

botVoice.dialog('/chat', [
    function (session) {
        session.send(prompts.chat.intro);
        calling.Prompts.confirm(session, prompts.chat.confirm);        
    },
    function (session, results) {
        if (results.response) {
            // Delete conversation field from address to trigger starting a new conversation.
            var address = session.message.address;
            delete address.conversation;

            // Create a new chat message and pass it callers address
            var msg = new builder.Message()
                .address(address)
                .attachments([
                    new builder.HeroCard(session)
                        .title("Hero Card")
                        .subtitle("Space Needle")
                        .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                        .images([
                            builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                        ])
                        .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                ]);

            // Send message through chat bot
            chatBot.send(msg, function (err) {
                session.endDialog(err ? prompts.chat.failed : prompts.chat.sent);
            });
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);


/***************************************************************************/
// Text Chat dialogs
/***************************************************************************/
bot.dialog('/', intents);

/** Answer users help requests. We can use a DialogAction to send a static message. */
intents.matches('Help', builder.DialogAction.send(prompts.helpMessage));
intents.matches('DisplayAgenda', builder.DialogAction.send(prompts.mtgDisplayAgenda));


/** Add attendee specified or request a shortname if one does not.  */
intents.matches('AddAttendee', [
    function (session, args, next) {
        // See if it got attendees from our LUIS model.
        var attendee = builder.EntityRecognizer.findEntity(args.entities, 'Attendee');
        if (!attendee) {
            // Prompt user to enter attendee.
            builder.Prompts.text(session, prompts.saveAttendeeMissing);
        } else {
            // Pass attendee to next step.
            next({ response: attendee.entity });
        }
    },
    function (session, results) {
        // Save the attendee
        if (results.response) {
            if (!session.userData.attendee) {
                session.userData.attendee = [results.response];
            } else {
                session.userData.attendee.push(results.response);
            }
            // recreate list for display since a new user was added
            var list = '';
            session.userData.attendee.forEach(function (value, index) {
                list += session.gettext(prompts.listAttendee, { index: index + 1, attendee: value });
            });
            session.userData.attendeelist = list;
            session.send(prompts.saveAttendeeAdded, { attendee: results.response, list: session.userData.attendeelist});
        } else {
            session.send(prompts.canceled);
        }
    }
]);

// Remove attendees by selecting Number or Name
intents.matches('RemoveAttendee', [
    function (session, args, next) {
        // Do we have any attendees?
        if (session.userData.attendee && session.userData.attendee.length > 0) {
            // See if got the Attendee from our LUIS model.
            var topAttendee;
            var name = builder.EntityRecognizer.findEntity(args.entities, 'Attendee');
            if (name) {
                // Find it in our list of attendees
                topAttendee = builder.EntityRecognizer.findBestMatch(session.userData.attendee, name.entity);
            }
            
            // Prompt user if task missing or not found
            if (!topAttendee) {
                builder.Prompts.choice(session, prompts.removeAttendeeMissing, session.userData.attendee);
            } else {
                next({ response: topAttendee });
            }
        } else {
            session.send(prompts.listNoAttendee);
        }
    },
    function (session, results) {
        if (results && results.response) {
            session.userData.attendee.splice(results.response.index, 1);
            // Update attendee list variable
            var list = '';
            session.userData.attendee.forEach(function (value, index) {
                list += session.gettext(prompts.listAttendee, { index: index + 1, attendee: value });
            });
            session.userData.attendeelist = list;
            session.send(prompts.removeAttendeeDone, { attendee: results.response.entity, list: session.userData.attendeelist });
        } else {
            session.send(prompts.canceled);
        }
    }
]);

/** List attendees - super simplified now **/
intents.matches('ListAttendees', function (session) {
    if (session.userData.attendee && session.userData.attendee.length > 0) 
    {
            session.send(prompts.listAttendees, session.userData.attendeelist);
    }
    else {
        session.send(prompts.listNoAttendees);
    }
});

// Action Item BEGIN
/** Add the Action Item specified or request an Action Item if one does not.  */
intents.matches('AddActionItem', [
    function (session, args, next) {
        // See if it got Action Item Title from our LUIS model.
        var actionitem = builder.EntityRecognizer.findEntity(args.entities, 'ActionItemTitle');
        if (!actionitem) {
            // Prompt user to enter actionitem.
            builder.Prompts.text(session, prompts.saveActionItemMissing);
        } else {
            // Pass actionitem to next step.
            next({ response: actionitem.entity });
        }
    },
    function (session, results) {
        // Save the actionitem
        if (results.response) {
            if (!session.userData.actionitem) {
                session.userData.actionitem = [results.response];
            } else {
                session.userData.actionitem.push(results.response);
            }
            // recreate list for display since a new actionitem was added
            var list = '';
            session.userData.actionitem.forEach(function (value, index) {
                list += session.gettext(prompts.listActionItem, { index: index + 1, actionitem: value });
            });
            session.userData.actionitemlist = list;
            session.send(prompts.saveActionItemAdded, { actionitem: results.response, list: session.userData.actionitemlist});
        } else {
            session.send(prompts.canceled);
        }
    }
]);



/** List actionitem - super simplified now **/
intents.matches('ListActionItems', function (session) {
    if (session.userData.actionitem && session.userData.actionitem.length > 0) 
    {
            session.send(prompts.listActionItems, session.userData.actionitemlist);
    }
    else {
        session.send(prompts.listNoActionItems);
    }
});

// Remove actionitem by selecting Number or Name
intents.matches('RemoveActionItem', [
    function (session, args, next) {
        // Do we have any actionitem?
        if (session.userData.actionitem && session.userData.actionitem.length > 0) {
            // See if got the actionitem from our LUIS model.
            var topActionItem;
            var name = builder.EntityRecognizer.findEntity(args.entities, 'ActionItemTitle');
            if (name) {
                // Find it in our list of actionitems
                topActionItem = builder.EntityRecognizer.findBestMatch(session.userData.actionitem, name.entity);
            }
            
            // Prompt user if actionitem missing or not found
            if (!topActionItem) {
                builder.Prompts.choice(session, prompts.removeActionItem, session.userData.actionitem);
            } else {
                next({ response: topActionItem });
            }
        } else {
            session.send(prompts.listNoActionItem);
        }
    },
    function (session, results) {
        if (results && results.response) {
            session.userData.actionitem.splice(results.response.index, 1);
            // Update actionitem list variable
            var list = '';
            session.userData.actionitem.forEach(function (value, index) {
                list += session.gettext(prompts.listActionItem, { index: index + 1, actionitem: value });
            });
            session.userData.actionitemlist = list;
            session.send(prompts.removeActionItemDone, { actionitem: results.response.entity, list: session.userData.actionitemlist });
        } else {
            session.send(prompts.canceled);
        }
    }
]);
// Action Item END


// Meeting Minutes BEGIN
/** Add the Action Item specified or request an Action Item if one does not.  */
intents.matches('AddMinute', [
    function (session, args, next) {
        // See if it got minute title from our LUIS model.
        var minute = builder.EntityRecognizer.findEntity(args.entities, 'MinuteTitle');
        if (!minute) {
            // Prompt user to enter minute title.
            builder.Prompts.text(session, prompts.saveMinuteMissing);
        } else {
            // Pass minute title to next step.
            next({ response: minute.entity });
        }
    },
    function (session, results) {
        // Save the minute
        if (results.response) {
            if (!session.userData.minute) {
                session.userData.minute = [results.response];
            } else {
                session.userData.minute.push(results.response);
            }
            // recreate list for display since a new actionitem was added
            var list = '';
            session.userData.minute.forEach(function (value, index) {
                list += session.gettext(prompts.listMinute, { index: index + 1, minute: value });
            });
            session.userData.minutelist = list;
            session.send(prompts.saveMinuteAdded, { minute: results.response, list: session.userData.minutelist});
        } else {
            session.send(prompts.canceled);
        }
    }
]);

/** List minute **/
intents.matches('ListMinutes', function (session) {
    if (session.userData.minute && session.userData.minute.length > 0) 
    {
            session.send(prompts.listMinutes, session.userData.minutelist);
    }
    else {
        session.send(prompts.listNoMinutes);
    }
});

// Remove minute by selecting Number or Name
intents.matches('RemoveMinute', [
    function (session, args, next) {
        // Do we have any minute?
        if (session.userData.minute && session.userData.minute.length > 0) {
            // See if got the minute from our LUIS model.
            var topMinute;
            var name = builder.EntityRecognizer.findEntity(args.entities, 'MinuteTitle');
            if (name) {
                // Find it in our list of minutes
                topMinute = builder.EntityRecognizer.findBestMatch(session.userData.minute, name.entity);
            }
            
            // Prompt user if minute title missing or not found
            if (!topMinute) {
                builder.Prompts.choice(session, prompts.removeMinute, session.userData.minute);
            } else {
                next({ response: topMinute });
            }
        } else {
            session.send(prompts.listNoMinutes);
        }
    },
    function (session, results) {
        if (results && results.response) {
            session.userData.minute.splice(results.response.index, 1);
            // Update minute list variable
            var list = '';
            session.userData.minute.forEach(function (value, index) {
                list += session.gettext(prompts.listMinute, { index: index + 1, minute: value });
            });
            session.userData.minutelist = list;
            session.send(prompts.removeMinuteDone, { minute: results.response.entity, list: session.userData.minutelist });
        } else {
            session.send(prompts.canceled);
        }
    }
]);

// Meeting Minutes END

// Initialize for a new meeting
intents.matches('StartMeeting', [
    function (session, args, next) {
        session.userData.meetingtitle = '';
        session.userData.meetingstart = '';

        // Set Start Date
        session.userData.meetingstart = new Date();

        // See if it got title from our LUIS model.
        var meetingtitle = builder.EntityRecognizer.findEntity(args.entities, 'MeetingTitle');
        if (!meetingtitle) {
            // Prompt user to enter meetingtitle.
            builder.Prompts.text(session, prompts.saveMeetingTitleMissing);
        } else {
            // Pass meetingtitle to next step.
            next({ response: meetingtitle.entity });
        }
    },
    function (session, results) {
        // Save the meetingtitle
        if (results.response) {
            session.userData.meetingtitle = results.response;
            //session.userData.meetingtitle = [results.response];
            session.send(prompts.mtgStartMeeting, { meetingtitle: session.userData.meetingtitle });
            //session.send(session.userData.meetingtitle);
        } else {
            session.send(prompts.canceled);
        }
    }
]);

/** Summarize/Close Meeting **/
intents.matches('SummarizeMeeting', function (session) {
    // Create Title
    session.userData.meetingsummary = '---- MEETING SUMMARY: ' + session.userData.meetingtitle + ' ----\n';
    session.userData.meetingsummary += 'Start Time: ' + session.userData.meetingstart + ' ----\n\n';
        
    //Add Attendee list
    if (session.userData.attendeelist && session.userData.attendeelist.length > 0) { 
        session.userData.meetingsummary += "Attendee List:\n" + session.userData.attendeelist + "\n\n";
    };
    //Add Minutes list
    if (session.userData.minutelist && session.userData.minutelist.length > 0) { 
        session.userData.meetingsummary += "Meeting Minutes:\n" + session.userData.minutelist + "\n\n";
    };
    //Add Action Item List
    if (session.userData.actionitemlist && session.userData.actionitemlist.length > 0) {
        session.userData.meetingsummary += "Action Items:\n" + session.userData.actionitemlist + "\n\n";
    };
    //Close Meeting
    session.userData.meetingsummary += "Meeting Closed at: " + new Date();

    // EMAIL Meeting Summary
    sendgrid.send({
            to:       'deals@awd-design.com',
            from:     '"NW Assistant" <dials@awd-design.com>',
            subject:  'NW Assistant Meeting Details for: '+session.userData.meetingtitle,
            text:     session.userData.meetingsummary
        }, function(err, json) {
            if (err) { return console.error(err); }
            console.log(json);
        });

    //Summarize for chat
    session.send(session.userData.meetingsummary);
});
