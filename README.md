# Botchii

### Bot invite link

To invite this bot to your server use [this link](https://discord.com/api/oauth2/authorize?client_id=802315557981913130&permissions=268520512&scope=bot).

### Dependencies
* `discord.js`
* `dotenv`
* `emoji-regex`
* `typescript`
* And optionally python 3.8 to use the crappy, yet working `launch.py`

### Description
~~To be written...~~

### Todo

#### * Change the way `.channel` behaves:
`.channel` -> lists tracked base and target channels
`.channel <from|base> <channels...>` -> sets base channels
`.channel <to|target> <channels...>` -> sets target channels
`.channel alias <channel alias> <channels...>` -> sets a channel alias
  aliases can be used instead of channel ID's. One alias can correspond to multiple.

Change it, so it **does not** automatically look for reactions on all messages in base channels!

#### * Introduce the command `.announce`:
`.announce <message link> [target channel]` -> creates a poll on the message specified
  if target channel isn't specified, it announces to all target channels. Aliases can be used.
