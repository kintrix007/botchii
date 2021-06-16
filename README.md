# Botchii

### Bot invite

To invite this bot to your server use [this link](https://discord.com/api/oauth2/authorize?client_id=802315557981913130&permissions=268520512&scope=bot).

### Dependencies
* `discord.js`
* `dotenv`
* `emoji-regex`
* `typescript`
* And optionally python 3.8 to use the crappy, yet working `launch.py`

### Description
~~To be written...~~

---

# Todo

- [x] **Change the way `.channel` behaves:**\
`.channel` -> Lists tracked base and target channels.\
`.channel <from|base> <channels...>` -> Sets base channels.\
`.channel <to|target> <channels...>` -> Sets target channels.\
`.channel alias <channel alias> <channels...>` -> Sets a channel alias.\
  aliases can be used instead of channel ID's. One alias can correspond to multiple.\
\
Change it, so it **does not** automatically look for reactions on all messages in base channels!

- [x] **Introduce the command `.announce`:**\
`.announce <message link> [target channels...]` -> Creates a poll on the message specified.\
  If 'target channel' is omitted, announces to all target channels. Channel aliases can be used.
  Instead of a message link, it can be a message ID, from the same channel.
  Can only point to messages in base announcement channels.

- [x] **Make `.announce` work with replying**

- [ ] **Improve some variable names, and filenames!** - never done!

- [x] **Invalidate announcement trackers after a set amount of time**
- [x] **Indicate on the message, when it's invalidated**
- [ ] **Re-add profile picture change after announcing**
- [x] **Change the way `getPrefix` works, so it's called without arguements**
- [ ] **Add proper logging**
- [x] **Correctly indicate all invalid/timed out announce messages**
- [ ] **Send temporary confirmation message when adding a vote**
- [ ] **Add option for default command or so...**
