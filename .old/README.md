# Botchii

### Bot invite

To invite this bot to your server use [this link](https://discord.com/api/oauth2/authorize?client_id=802315557981913130&permissions=268520512&scope=bot).

### Dependencies
* `discord.js`

---

# Setup

You can run `npm run setup` to have a simple CLI help you make the needed file(s).

---

### Todo

- [x] **Change the way `.channel` behaves:**\
  `.channel` -> Lists tracked base and target channels.\
  `.channel <from|base> <channels...>` -> Sets base channels.\
  `.channel <to|target> <channels...>` -> Sets target channels.\
  `.channel alias <channel alias> <channels...>` -> Sets a channel alias.\
  aliases can be used instead of channel ID's. One alias can correspond to multiple.\
  Change it, so it **does not** automatically look for reactions on all messages in base channels!

- [x] **Introduce the command `.announce`:**\
  `.announce <message link> [target channels...]` -> Creates a poll on the message specified.\
  If 'target channel' is omitted, announces to all target channels. Channel aliases can be used.\
  Instead of a message link, it can be a message ID, from the same channel.\
  Can only point to messages in base announcement channels.

- [x] **Make `.announce` work with replying**

- [x] **Fix some stupid variable names, and filenames!**

- [x] **Invalidate announcement trackers after a set amount of time**
- [x] **Indicate on the message, when it's invalidated**
- [ ] **Re-add profile picture change after announcing**
- [x] **Change the way `getPrefix` works, so it's called without arguements**
- [ ] **Add proper logging**
- [x] **Correctly indicate all invalid/timed out announce messages**
- [x] **Send temporary confirmation message when adding a vote**
- [x] **Remove `removeAccents` from core, and add a way to give content modifier functions**
- [x] **Add `impl` field to `BotUtils` with the functions that should not be acessed by the user**
- [ ] **Make `bot_types.ts` optional or replace it with something nicer**
- [x] **Add a listeners module, which creates discord.js listeners and has an API to add listeners and modify their callbacks**
- [x] **Add configurable default command when pinging the bot, with for optional use**
- [ ] **Change announce to use the `from` an `to` aliases for announcing, intead of the current custom behavior**
- [ ] **Add an option so that the reply message automatically becomes first arguement**
- [x] **Make channel aliases a core part of the bot**
- [x] **Add `limitCommand`, which limits the usages of certain commands to given channels ONLY**
- [ ] **Fix bug: limiting the usage of `limit` command to a channel, then deleting that channel**
