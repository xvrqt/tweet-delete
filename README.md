# Tweet Delete
Use this script to delete your tweets through Twitter's frontend; especially now that Elon wants $5k a month for API access this tool can provide a little relief.

## How to use
1. Copy the contents of "script.js"
2. Go to your twitter profile's "Tweets" tab
3. Open your browser's dev console
4. Paste in the console and execute it
5. Watch it work

**WARNING:** Do not run anywhere else other than your profile's tweet tab or it may do something unintended.

### Optional
There are some settings you can edit near the top of the script in case you don't want to remove tweets after a certain date, undo retweets, etc...

You don't need to set any of these, not even the `username` parameter if you don't want to.

## Limitations
- Twitter only loads the 3,200 most recent tweets through the tweets tab so this cannot delete all your tweets if you have more than that
- I have only tested it on Safari
- Requires latest JS support (at least version 8)
- It could break at anytime as the site changes and updates (create an issue and I'll see what I can do).

