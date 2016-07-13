
module.exports = {
    helpMessage: "Hi!!  Nationwide Assistant at your service:\n\n" +
    "I will try to help document your meetings.  Ask me to start a meeting kicks it off.\n\n" +
    "I can also track items like meeting minutes, action items, attendees, etc.\n\n" +
    "You already have me added in, so ask me to start a meeting and off we go!",
    mtgStartMeeting: "Thanks for engaging me! I can definitely assist you with documenting your meeting.  You current meeting is titled '%(meetingtitle)s'.\nSome items I am can help with are:\n" +
    "- Roll call: Feel free to ask me to add and remove attendees\n" +
    "- Track meeting minutes: I can add, remove, and list minutes\n" +
    "- Track action items:  I can add, remove, and list action items\n" +
    "- Ask me to summarize the meeting and I will!\n" +
    "- When you are done, ask me to close the meeting and I will present the summary, and send off email to all attendees.",
    canceled: 'Ok... nobody action taken.',
    mtgAddMinute: 'Add Minute.',
    saveMeetingTitleMissing: 'What would you like me to title this meeting?',
    saveAttendeeAdded: "Attendee '%(attendee)s' was added! \nCurrent Attendee list:\n%(list)s",
    saveAttendeeMissing: "What is the attendee's shortname?",
    listAttendees: 'The full attendee list consists of:\n%s',
    listAttendee: '%(index)d. %(attendee)s\n',
    listNoAttendees: 'What? No attendees? You might want to add one.',
    removeAttendeeMissing: "Which attendee would you like to delete?\n",
    removeAttendeeDone: "Removed '%(attendee)s' from your attendee list. \nThe current attendee list is:\n%(list)s",
    saveActionItemAdded: "Action Item '%(actionitem)s' was added! \nCurrent Action Item list:\n%(list)s",
    saveActionItemMissing: 'Please enter the Action Item title to add:',
    listActionItems: 'Full Action Item list:\n%s',
    listActionItem: '%(index)d. %(actionitem)s\n',
    listNoActionItems: 'You have no Action Items.',
    removeActionItemMissing: "Which Action Item would you like to delete?\n",
    removeActionItemDone: "Removed '%(minute)s' from your Meeting Minutes. \nCurrent Meeting Minutes are:\n%(list)s",
    saveMinuteAdded: "Minute '%(minute)s' was added! \nCurrent Meeting Minutes:\n%(list)s",
    saveMinuteMissing: 'Please enter the Meeting Minute to add:',
    listMinutes: 'Current Meeting Minutes:\n%s',
    listMinute: '%(index)d. %(minute)s\n',
    listNoMinutes: 'You have no Meeting Minutes.',
    removeMinuteMissing: "Which Meeting Minute would you like to delete?\n",
    removeMinuteDone: "Removed '%(minute)s' from your Meeting Minutes. \nCurrent Meeting Minutes are:\n%(list)s",
    chatGreeting: "Hi... Please call me to interact with me.",
    welcomeBack: "Hey there.... welcome back stranger!  I am still here ready to assist in your meeting documentation!",
    goodbye: "Okie dokie... See you later!",
    Menu: {
        prompt: "What demo would you like to run?",
        choices: "Your choices are DTMF, Digits, Recordings, or Chat.",
        help: "You can say options to hear the list of choices again, quit to end the demo, or help." 
    },
    dtmf: {
        intro: "You can choose to use either speech or DTMF based recognition for choices.",
        prompt: "Press 1 for option A, 2 for option B, or 3 for option C.",
        result: "You selected %s"
    },
    digits: {
        intro: "You can collect digits from a user with an optional stop tone.",
        prompt: "Please enter your 5 to 10 digit account number followed by pound.",
        inavlid: "I'm sorry. That account number isn't long enough.",
        confirm: "You entered %s. Is that correct?"
    },
    record: {
        intro: "You can prompt users to record a message.",
        prompt: "Please leave a message after the beep.",
        result: "Your message was %d seconds long."
    },
    chat: {
        intro: "You can easily send a chat message to a user that has called your bot.",
        confirm: "Would you like to send a message?",
        failed: "Message delivery failed.",
        sent: "Message sent."
    }
}
