---
heroImage: './images/fix-error-establishing-database-connection/featured.png'
title: 'How to Fix "Error Establishing a Database Connection" in WordPress'
description: 'What the WordPress database connection error means, the five most common causes, and how to fix each one, in plain English.'
pubDate: 2026-10-28
tags: ['WordPress', 'Troubleshooting']
---

You load your website and instead of your homepage you get a blank white page with one line of text: **"Error establishing a database connection."** Every page shows the same thing, including the admin area. It looks alarming, but your content is almost always still there. WordPress just can't reach it.

Here's what the error means, what usually causes it, and how to fix it.

## What the error means

Every WordPress page is assembled on the fly from two parts: the files on your server (themes, plugins, WordPress itself) and a MySQL or MariaDB database that holds your pages, posts, settings and users. When a visitor arrives, WordPress connects to that database to fetch the content. If the connection fails, WordPress has nothing to show, so it shows this error instead.

The fix depends on why the connection failed. Work through these in order; the first two cover most cases.

## 1. Check whether the database server is down

If your site was fine an hour ago and you haven't changed anything, the most likely cause is your host's database server, not your site.

- Check your host's status page or support channel for an outage.
- If you have other sites on the same hosting account, see whether they show the same error. If they all do, it's the server.
- A sudden spike in traffic or a runaway process can also exhaust the database's connections on shared hosting.

If it's the host, there's nothing to fix on your end. Open a support ticket and wait it out.

## 2. Check your database credentials

WordPress finds its database using four settings in the `wp-config.php` file at the root of your site:

```php
define( 'DB_NAME', 'database_name_here' );
define( 'DB_USER', 'username_here' );
define( 'DB_PASSWORD', 'password_here' );
define( 'DB_HOST', 'localhost' );
```

If any of these is wrong, the connection fails. This often happens right after a site migration, a host change, or a database password reset.

1. Open your hosting control panel and find the database section (often called MySQL Databases).
2. Confirm the database name and username match what's in `wp-config.php`.
3. If you're not sure of the password, reset it in the control panel and update `DB_PASSWORD` to match.
4. Check `DB_HOST`. It's usually `localhost`, but some hosts use a separate address. Your host's documentation will say which.

Edit `wp-config.php` carefully: one missing quote or semicolon will take the site down with a different error.

## 3. Repair a corrupted database

If the front of your site shows the error but `/wp-admin` shows a message about repairing the database, one or more tables may be corrupted. WordPress has a built-in repair tool.

1. Add this line to `wp-config.php`, just above the line that says "That's all, stop editing!":

   ```php
   define( 'WP_ALLOW_REPAIR', true );
   ```

2. Visit `yoursite.com/wp-admin/maint/repair.php` and choose **Repair Database**.
3. When it finishes, **remove that line** from `wp-config.php`. The repair page doesn't require a login, so leaving it on is a security risk.

## 4. Look for damaged WordPress files

Less often, a failed update or a hacked site leaves core WordPress files damaged. If the first three steps check out, download a fresh copy of WordPress from wordpress.org and replace the `wp-admin` and `wp-includes` folders on your server. Don't touch `wp-content` (your themes, plugins and uploads) or `wp-config.php`.

If you suspect a hack, stop here and get help. Replacing files won't remove malware hidden elsewhere.

## 5. Restore from a backup

If nothing else works, restore the most recent backup from before the error started. This is where a good backup routine pays for itself: a restore takes minutes when backups are recent and stored off the server, and much longer when they aren't.

## How to keep it from happening again

Most database connection errors trace back to one of three things: hosting that can't handle your traffic, credentials changed without updating `wp-config.php`, or updates that failed halfway. Good hosting, regular off-site backups and someone watching uptime around the clock make this error rare, and quick to fix when it does happen.

That's exactly what my [WordPress care plans](/wordpress-care-plans/) cover: weekly updates, daily security scans, regular off-site backups and uptime monitoring, so if your site goes down I usually know before you do.

If your site is showing this error right now and you'd rather not dig into server files, [get in touch](/contact/) or call me at (415) 390-6563.
