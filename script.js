(async () => {
    // User Settings
    let username = 'xvrqt'; // Fill in your own, obviously

    let undo_rts = true; // Undo retweets as well as delete tweets
    let delete_limit = Number.MAX_VALUE; // Stop after X undos + deletes
    let timeout = 500; // Time in ms to wait (increase if you're being locked out of your account) 
    let dont_delete_older_than = '2006-07-14'; // Don't delete tweets older than this date (YYYY-MM-DD)

    // Dev Variables (Assuming these might change over time but the UI won't)
    let num_tweets_selector = '[role="heading"]+div'; // "73.3k Tweets"
    let tweet_selector = '[data-testid="tweet"]'; // The tweet node itself
    let tweet_menu_selector = '[data-testid="caret"]'; // '...' in the upper right
    let rt_seletector = '[data-testid="unretweet"]'; // Detect/Select RT's
    let rt_confirm_selector = '[data-testid="unretweetConfirm"]';
    let menu_item_selector = '[role="menuitem"]';
    let delete_confirm_selector = '[data-testid="confirmationSheetConfirm"]';
    let wtf_selector = '//span[contains(., "Who to follow")]';
    let header_photo_selector = 'a[href="/' + username + '/header_photo"]';
    let trending_selector = '[data-testid="sidebarColumn"]';

    let date_limit = new Date(dont_delete_older_than);
    let max_errors = 2500; // Sometimes things don't load quickly and this puts a limit of retries
 
    // Convenience Functions
    function gaussianRandom(mean, stdev) {
        const u = 1 - Math.random(); // Converting [0,1) to (0,1]
        const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        // Transform to the desired mean and standard deviation:
        return z * stdev + mean;
    }

    // Adds some variance to the timing to make it bot detection more difficult
    function sleep() { 
        let ms = gaussianRandom(timeout, 150);
        ms = ms > 0 ? ms : timeout;
        return new Promise(r => setTimeout(r, ms)); 
    }
    
    function getTweetDateTime() {
        let date_str = document.querySelectorAll('[datetime]')[0];
        date_str = date_str.getAttribute('datetime');
 
        return new Date(date_str);
    }

    function cleanUpHeader() { // Making space on the time line
        let header_photo = document.querySelectorAll(header_photo_selector)[0];
        if(header_photo != null) {
            let header = header_photo.parentElement;
            if(header != null) {
                let parent_node = header.parentElement;
                parent_node.removeChild(header);
            }
        }
    }

    function cleanUpTrending() { // Fuck the trending tab
        let trending_tab = document.querySelectorAll(trending_selector)[0];
        let parent_node = trending_tab.parentElement;
        if(parent_node && trending_tab) {
            parent_node.removeChild(trending_tab);
        }
    }

    function cleanUpWTF() { // Removes the "Who to follow" field
        let node_wtf = document.evaluate(wtf_selector, document.body, null, XPathResult.ANY_TYPE, null);
        node_wtf = node_wtf.iterateNext();
        if(node_wtf == null) { return; }
        else { // Grab root element (6 up from the selected)
            node_wtf = getNthParent(node_wtf, 6);

            // Locate siblings, and parent node
            let parent_node = node_wtf.parentElement;
            let sibling = node_wtf;
            let siblings = [];
            let num_sibs = 4;
            for(let i = 0; i < num_sibs; i++) {
                sibling = sibling.nextSibling;
                if(sibling != null) { siblings.push(sibling); }
                else { break; }
            }

            parent_node.removeChild(node_wtf);
            siblings.forEach(s => parent_node.removeChild(s));
        }
    }

    function updateUser() {
        let tweet_num = document.querySelectorAll(num_tweets_selector)[1].textContent;
        console.log('Tweets Deleted: ' + num_deleted);
        if(undo_rts) { console.log('Tweets Undone: ' + num_rt_undone) }
        console.log('Tweets Remaining: ', tweet_num);
    }

    function getNthParent(node, n) {
        for(let i = 0;i<n;i++) {
            if(node == null) { break; }
            node = node.parentElement;
        }
        return node;
    }

    function thereAndBackAgain() { // Scrolls to load and then back to top
        // Scroll a bit to load more posts
        window.scrollBy({
            top: 10000,
            left: 0,
            behavior: "instant"
        });
        // Scroll back to the top (sometimes it gets messed up if it's not in view)
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant"
        });
    }

    let num_deleted = 0;
    let num_rt_undone = 0;
    let num_errs = 0;

    await document.load
    cleanUpHeader();
    //cleanUpTrending();
    cleanUpWTF();
    thereAndBackAgain();
    while(document.querySelectorAll(tweet_menu_selector).length) {try {
        //Check if we've hit the delete limit
        if((num_deleted + num_rt_undone) >= delete_limit) { 
            console.log("Delete limit reached."); 
            break;
        }

        // Check if we've passed the date limit
        if (getTweetDateTime() < date_limit) {
                console.log('Deleted Tweets up to date limit');
                break;
        }

        // Provide an update, scroll the window to load more tweets
        if((num_rt_undone + num_deleted) % 10 == 0) {
            updateUser();
        }

        // Load more posts
        thereAndBackAgain(); 
        await sleep()

        // Get the next tweet
        let tweet = document.querySelectorAll(tweet_selector)[0];

        // Undo retweets if(undo_rts && tweet.querySelectorAll(rt_seletector.length) {
        if(tweet.querySelectorAll(rt_seletector).length) {
            tweet.querySelectorAll(rt_seletector)[0].click();
            await sleep()
            document.querySelectorAll(rt_confirm_selector)[0].click();
            await sleep()
            num_rt_undone = num_rt_undone + 1.0;
        }
        else { // Delete the tweet
            tweet.querySelectorAll(tweet_menu_selector)[0].click();
            await sleep()
            document.querySelectorAll(menu_item_selector)[0].click();
            await sleep()
            document.querySelectorAll(delete_confirm_selector)[0].click();
            num_deleted = num_deleted + 1.0;
        }
        // Sometimes elements don't load quickly enough, and it's better to
        // retry the loop than cause an error as this varies a lot.
        } catch(e) {
            num_errs = num_errs + 1;
            if(num_errs > max_errors) {
                console.error('Aborting retry, too many errors.');
                break;
            } else {
                console.error(e);
                console.warn('Retrying...');
                continue;
            }
        }
    }

    // Write out one more time before we end :]
    updateUser();
})();

