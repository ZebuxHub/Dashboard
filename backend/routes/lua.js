const express = require('express');
const router = express.Router();

// Serve Lua sync script
router.get('/sync.lua', (req, res) => {
  const apiUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}/api`;
  
  const luaScript = `-- Zebux Dashboard Sync Script
-- Auto-generated from ${apiUrl}
local WebsiteSync = {}
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

-- Configuration
local CONFIG = {
    apiUrl = "${apiUrl}",
    token = "", -- Set your token here
    syncInterval = 300, -- 5 minutes default
    autoStart = true,
    debug = false
}

-- State management
local isRunning = false
local lastSync = 0
local syncConnection = nil

-- Utility functions
local function log(message)
    if CONFIG.debug then
        print("🎮 [Zebux Sync]", message)
    end
end

local function safeRequest(url, method, data, headers)
    local success, result = pcall(function()
        local requestData = {
            Url = url,
            Method = method or "GET",
            Headers = headers or {},
            Body = data and HttpService:JSONEncode(data) or nil
        }
        
        if syn and syn.request then
            return syn.request(requestData)
        elseif http_request then
            return http_request(requestData)
        else
            error("No HTTP request function available")
        end
    end)
    
    if success then
        return result
    else
        warn("❌ HTTP Request failed:", result)
        return nil
    end
end

-- Data collection functions
local function getPlayerData()
    local player = Players.LocalPlayer
    if not player then return nil end
    
    local data = {
        username = player.Name,
        displayName = player.DisplayName,
        userId = player.UserId,
        timestamp = os.time(),
        gameData = {}
    }
    
    -- Try to get game-specific data
    pcall(function()
        local playerGui = player:WaitForChild("PlayerGui", 1)
        if playerGui then
            -- Get coins
            local dataFolder = playerGui:FindFirstChild("Data")
            if dataFolder then
                local asset = dataFolder:FindFirstChild("Asset")
                if asset then
                    data.gameData.coins = asset:GetAttribute("Coin") or 0
                    data.gameData.gems = asset:GetAttribute("Gem") or 0
                end
                
                -- Get pets
                local pets = dataFolder:FindFirstChild("Pets")
                if pets then
                    local petCount = 0
                    for _, pet in pairs(pets:GetChildren()) do
                        if pet:IsA("Folder") then
                            petCount = petCount + 1
                        end
                    end
                    data.gameData.pets = petCount
                end
                
                -- Get eggs
                local eggs = dataFolder:FindFirstChild("Egg")
                if eggs then
                    local eggCount = 0
                    for _, egg in pairs(eggs:GetChildren()) do
                        if egg:IsA("IntValue") then
                            eggCount = eggCount + egg.Value
                        end
                    end
                    data.gameData.eggs = eggCount
                end
            end
        end
    end)
    
    return data
end

-- Sync function
function WebsiteSync.SyncData()
    if not CONFIG.token or CONFIG.token == "" then
        warn("❌ No token set! Please configure your token.")
        return false
    end
    
    local data = getPlayerData()
    if not data then
        warn("❌ Could not collect player data")
        return false
    end
    
    log("📊 Syncing data for " .. data.username)
    
    local headers = {
        ["Content-Type"] = "application/json",
        ["Authorization"] = "Bearer " .. CONFIG.token
    }
    
    local response = safeRequest(
        CONFIG.apiUrl .. "/sync",
        "POST",
        data,
        headers
    )
    
    if response and response.StatusCode == 200 then
        log("✅ Sync successful")
        lastSync = tick()
        return true
    else
        warn("❌ Sync failed:", response and response.StatusCode or "No response")
        return false
    end
end

-- Main functions
function WebsiteSync.Start()
    if isRunning then
        log("⚠️ Sync already running")
        return
    end
    
    isRunning = true
    log("🚀 Starting sync service...")
    
    -- Initial sync
    WebsiteSync.SyncData()
    
    -- Setup periodic sync
    syncConnection = RunService.Heartbeat:Connect(function()
        if tick() - lastSync >= CONFIG.syncInterval then
            WebsiteSync.SyncData()
        end
    end)
    
    log("✅ Sync service started (interval: " .. CONFIG.syncInterval .. "s)")
end

function WebsiteSync.Stop()
    if not isRunning then
        log("⚠️ Sync not running")
        return
    end
    
    isRunning = false
    if syncConnection then
        syncConnection:Disconnect()
        syncConnection = nil
    end
    
    log("🛑 Sync service stopped")
end

function WebsiteSync.SetToken(token)
    CONFIG.token = token
    log("🎫 Token updated")
end

function WebsiteSync.SetInterval(seconds)
    CONFIG.syncInterval = math.max(60, seconds) -- Minimum 1 minute
    log("⏱️ Sync interval set to " .. CONFIG.syncInterval .. "s")
end

function WebsiteSync.GetStatus()
    return {
        running = isRunning,
        lastSync = lastSync,
        interval = CONFIG.syncInterval,
        hasToken = CONFIG.token ~= ""
    }
end

-- Auto-start if configured
if CONFIG.autoStart then
    task.wait(2) -- Wait for game to load
    WebsiteSync.Start()
end

-- Global access
getgenv().WebsiteSync = WebsiteSync

return WebsiteSync`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="WebsiteSync.lua"');
  res.send(luaScript);
});

module.exports = router;