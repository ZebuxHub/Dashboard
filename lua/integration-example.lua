-- ============ ZEBUX DASHBOARD INTEGRATION EXAMPLE ============
-- Add this to your existing Build A Zoo script to sync data to your dashboard
-- This example shows how to integrate with your Premium_Build_A_ZOO.lua script

-- ============ STEP 1: Load the WebsiteSync Module ============
-- Add this near the top of your script, after services are loaded

local WebsiteSync = nil
pcall(function()
    WebsiteSync = loadstring(game:HttpGet("https://your-dashboard-url.railway.app/api/lua/sync.lua"))()
end)

-- ============ STEP 2: Initialize WebsiteSync ============
-- Add this after your WindUI setup

if WebsiteSync then
    -- Initialize with your token (get this from your dashboard)
    WebsiteSync.Init({
        token = "your-generated-token-here", -- Replace with your actual token
        apiUrl = "https://your-dashboard-url.railway.app/api", -- Replace with your actual URL
        syncInterval = 5 * 60, -- Sync every 5 minutes
        autoStart = true, -- Start automatically
        debug = false -- Set to true for debugging
    })
    
    print("✅ Zebux Dashboard sync initialized!")
else
    warn("❌ Failed to load Zebux Dashboard sync")
end

-- ============ STEP 3: Manual Sync Functions (Optional) ============
-- Add these functions to manually trigger syncs

local function syncNow()
    if WebsiteSync then
        local success = WebsiteSync.SyncNow()
        if success then
            WindUI:Notify({
                Title = "📊 Dashboard Sync",
                Content = "Data synced to dashboard successfully!",
                Duration = 3
            })
        else
            WindUI:Notify({
                Title = "❌ Sync Failed",
                Content = "Failed to sync data to dashboard",
                Duration = 3
            })
        end
    end
end

local function getSyncStatus()
    if WebsiteSync then
        local status = WebsiteSync.GetStatus()
        local statusText = string.format(
            "Running: %s\nLast Sync: %s\nToken: %s\nInterval: %ds",
            status.running and "Yes" or "No",
            status.lastSync > 0 and os.date("%H:%M:%S", status.lastSync) or "Never",
            status.token,
            status.syncInterval
        )
        
        WindUI:Notify({
            Title = "📊 Dashboard Status",
            Content = statusText,
            Duration = 5
        })
    end
end

-- ============ STEP 4: Add UI Controls (Optional) ============
-- Add these to your existing UI tabs

if Tabs and Tabs.SaveTab then
    Tabs.SaveTab:Section({ Title = "📊 Dashboard Sync", Icon = "activity" })
    
    Tabs.SaveTab:Button({
        Title = "📊 Sync Now",
        Desc = "Manually sync data to dashboard",
        Callback = syncNow
    })
    
    Tabs.SaveTab:Button({
        Title = "📈 Dashboard Status",
        Desc = "Check dashboard sync status",
        Callback = getSyncStatus
    })
    
    Tabs.SaveTab:Button({
        Title = "🌐 Open Dashboard",
        Desc = "Open your dashboard in browser",
        Callback = function()
            WindUI:Notify({
                Title = "🌐 Dashboard",
                Content = "Visit: https://your-dashboard-url.railway.app",
                Duration = 5
            })
        end
    })
end

-- ============ STEP 5: Auto-sync on Important Events (Optional) ============
-- Sync data when important things happen

-- Sync after successful egg purchase
local originalBuyEggByUID = buyEggByUID
if originalBuyEggByUID then
    buyEggByUID = function(eggUID)
        local result = originalBuyEggByUID(eggUID)
        if result and WebsiteSync then
            task.spawn(function()
                task.wait(2) -- Wait for data to update
                WebsiteSync.SyncNow()
            end)
        end
        return result
    end
end

-- Sync after pet hatching
local originalHatchEggDirectly = hatchEggDirectly
if originalHatchEggDirectly then
    hatchEggDirectly = function(eggUID)
        local result = originalHatchEggDirectly(eggUID)
        if result and WebsiteSync then
            task.spawn(function()
                task.wait(3) -- Wait for hatching to complete
                WebsiteSync.SyncNow()
            end)
        end
        return result
    end
end

-- ============ STEP 6: Cleanup on Script End ============
-- Add this to your existing cleanup code

local originalCleanup = Window and Window.OnClose
if originalCleanup then
    Window:OnClose(function()
        -- Stop WebsiteSync
        if WebsiteSync then
            WebsiteSync.Stop()
        end
        
        -- Call original cleanup
        originalCleanup()
    end)
end

-- ============ CONFIGURATION NOTES ============
--[[
    IMPORTANT: Replace these placeholders with your actual values:
    
    1. "your-generated-token-here" 
       → Get this from: https://your-dashboard-url.railway.app/token
    
    2. "your-dashboard-url.railway.app"
       → Your actual Railway/Heroku/DigitalOcean URL
    
    3. Sync Interval Options:
       → 1 * 60 = 1 minute (frequent updates)
       → 5 * 60 = 5 minutes (recommended)
       → 10 * 60 = 10 minutes (less frequent)
       → 30 * 60 = 30 minutes (rare updates)
    
    FEATURES:
    ✅ Automatic data sync every X minutes
    ✅ Manual sync button
    ✅ Status checking
    ✅ Auto-sync on important events
    ✅ Error handling and notifications
    ✅ Easy integration with existing code
    
    DASHBOARD FEATURES:
    📊 Real-time data display
    📈 Historical charts
    🎮 Multi-account support
    📱 Mobile responsive
    🎨 Beautiful glassmorphism UI
    🔒 Secure token system
    ⚡ High performance
--]]

-- ============ EXAMPLE COMPLETE INTEGRATION ============
--[[
-- Here's how your script might look with full integration:

-- Services and WindUI setup (your existing code)
local WindUI = loadstring(game:HttpGet("..."))()
-- ... your existing setup ...

-- Load WebsiteSync
local WebsiteSync = loadstring(game:HttpGet("https://zebux-dashboard.railway.app/api/lua/sync.lua"))()

-- Initialize WebsiteSync
WebsiteSync.Init({
    token = "abc123def456...", -- Your actual token
    apiUrl = "https://zebux-dashboard.railway.app/api",
    syncInterval = 5 * 60,
    autoStart = true
})

-- Your existing script continues...
-- All your auto buy, auto hatch, etc. code

-- Add dashboard controls to your UI
Tabs.SaveTab:Button({
    Title = "📊 Sync to Dashboard",
    Desc = "Upload current data to your dashboard",
    Callback = function()
        WebsiteSync.SyncNow()
    end
})

-- That's it! Your data will now sync automatically to your beautiful dashboard!
--]]
