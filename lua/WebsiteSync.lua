-- ============ Zebux Website Sync System ============
-- Automatically sync game data to your personal dashboard
-- Easy integration with any Roblox script

local WebsiteSync = {}

-- Services
local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")

-- Configuration
local LocalPlayer = Players.LocalPlayer
local config = {
    token = nil,
    apiUrl = "https://zebux-dashboard.railway.app/api", -- Default API URL
    syncInterval = 5 * 60, -- 5 minutes in seconds
    autoStart = false,
    debug = false
}

-- State
local isRunning = false
local lastSync = 0
local syncConnection = nil

-- Utility Functions
local function log(message)
    if config.debug then
        print("[WebsiteSync]", message)
    end
end

local function formatNumber(num)
    if type(num) == "string" then
        return num
    end
    if num >= 1e12 then
        return string.format("%.1fT", num / 1e12)
    elseif num >= 1e9 then
        return string.format("%.1fB", num / 1e9)
    elseif num >= 1e6 then
        return string.format("%.1fM", num / 1e6)
    elseif num >= 1e3 then
        return string.format("%.1fK", num / 1e3)
    else
        return tostring(num)
    end
end

-- Data Collection Functions
local function getPlayerData()
    local playerData = {
        userId = LocalPlayer.UserId,
        username = LocalPlayer.Name,
        displayName = LocalPlayer.DisplayName,
        accountAge = LocalPlayer.AccountAge,
        gameId = game.PlaceId,
        gameName = "Build A Zoo" -- Default game name
    }
    
    -- Try to get game name from MarketplaceService
    pcall(function()
        local MarketplaceService = game:GetService("MarketplaceService")
        local gameInfo = MarketplaceService:GetProductInfo(game.PlaceId)
        if gameInfo and gameInfo.Name then
            playerData.gameName = gameInfo.Name
        end
    end)
    
    return playerData
end

local function getInventoryData()
    local inventory = {
        coins = 0,
        fruits = {},
        eggs = {},
        pets = {},
        mutations = {},
        totalPets = 0,
        totalEggs = 0,
        placedPets = 0
    }
    
    -- Try to get data from PlayerGui
    local playerGui = LocalPlayer:FindFirstChild("PlayerGui")
    if not playerGui then 
        log("❌ PlayerGui not found")
        return inventory 
    end
    
    local data = playerGui:FindFirstChild("Data")
    if not data then 
        log("❌ Data folder not found")
        return inventory 
    end
    
    log("✅ Found PlayerGui.Data")
    
    -- Get Coins/Money/NetWorth
    pcall(function()
        -- Try multiple common money attribute names
        local moneyNames = {"NetWorth", "Money", "Cash", "Coins", "Balance"}
        for _, name in ipairs(moneyNames) do
            local value = LocalPlayer:GetAttribute(name)
            if value and type(value) == "number" then
                inventory.coins = value
                break
            end
        end
        
        -- Fallback: check leaderstats
        if inventory.coins == 0 then
            local leaderstats = LocalPlayer:FindFirstChild("leaderstats")
            if leaderstats then
                for _, stat in ipairs(leaderstats:GetChildren()) do
                    local statName = stat.Name:lower()
                    if statName:find("money") or statName:find("cash") or statName:find("coin") or statName:find("worth") then
                        inventory.coins = stat.Value or 0
                        break
                    end
                end
            end
        end
    end)
    
    -- Get Fruits from Asset folder
    pcall(function()
        local asset = data:FindFirstChild("Asset")
        if asset then
            -- Get all attributes first (more reliable)
            local attributes = asset:GetAttributes()
            for name, value in pairs(attributes) do
                if type(value) == "number" and value > 0 then
                    inventory.fruits[name] = value
                end
            end
            
            -- Also check children (fallback)
            for _, fruit in ipairs(asset:GetChildren()) do
                if fruit:IsA("IntValue") or fruit:IsA("NumberValue") then
                    local amount = fruit.Value or 0
                    if amount > 0 then
                        inventory.fruits[fruit.Name] = amount
                    end
                end
            end
        end
    end)
    
    -- Get Eggs from Egg folder (only available eggs - no subfolders)
    pcall(function()
        local eggFolder = data:FindFirstChild("Egg")
        if eggFolder then
            log("✅ Found Egg folder with " .. #eggFolder:GetChildren() .. " items")
            local eggCounts = {}
            local totalEggs = 0
            for _, egg in ipairs(eggFolder:GetChildren()) do
                -- Only count eggs with no subfolders (available eggs)
                if #egg:GetChildren() == 0 then
                    local eggType = egg:GetAttribute("T") or egg.Name
                    if eggType then
                        eggCounts[eggType] = (eggCounts[eggType] or 0) + 1
                        totalEggs = totalEggs + 1
                    end
                end
            end
            inventory.eggs = eggCounts
            inventory.totalEggs = totalEggs
            log("🥚 Found " .. totalEggs .. " available eggs")
        else
            log("❌ Egg folder not found")
        end
    end)
    
    -- Get Pets from Pets folder (only unplaced pets - no D attribute)
    pcall(function()
        local petsFolder = data:FindFirstChild("Pets")
        if petsFolder then
            log("✅ Found Pets folder with " .. #petsFolder:GetChildren() .. " items")
            local petCounts = {}
            local petSpeeds = {}
            local petMutations = {}
            local totalPets = 0
            local placedPets = 0
            
            for _, pet in ipairs(petsFolder:GetChildren()) do
                if pet:IsA("Configuration") then
                    local petType = pet:GetAttribute("T") or pet.Name
                    local mutation = pet:GetAttribute("M") or "None"
                    local dAttr = pet:GetAttribute("D") -- Placement attribute
                    
                    -- Check if pet is placed (has D attribute)
                    local isPlaced = dAttr ~= nil and tostring(dAttr) ~= ""
                    
                    if isPlaced then
                        placedPets = placedPets + 1
                    else
                        -- Only count unplaced pets
                        totalPets = totalPets + 1
                        
                        -- Count pets by type
                        petCounts[petType] = (petCounts[petType] or 0) + 1
                        
                        -- Get pet speed from ScreenStorage UI (like AutoPlaceSystem)
                        local speed = 0
                        pcall(function()
                            local pg = LocalPlayer and LocalPlayer:FindFirstChild("PlayerGui")
                            local screenStorage = pg and pg:FindFirstChild("ScreenStorage")
                            local frame = screenStorage and screenStorage:FindFirstChild("Frame")
                            local contentPet = frame and frame:FindFirstChild("ContentPet")
                            local scrolling = contentPet and contentPet:FindFirstChild("ScrollingFrame")
                            local node = scrolling and scrolling:FindFirstChild(pet.Name)
                            local btn = node and node:FindFirstChild("BTN")
                            local stat = btn and btn:FindFirstChild("Stat")
                            local price = stat and stat:FindFirstChild("Price")
                            local valueLabel = price and price:FindFirstChild("Value")
                            local txt = nil
                            if valueLabel and valueLabel:IsA("TextLabel") then
                                txt = valueLabel.Text
                            elseif price and price:IsA("TextLabel") then
                                txt = price.Text
                            end
                            if txt then
                                speed = tonumber((txt:gsub("[^%d]", ""))) or 0
                            end
                        end)
                        
                        -- Track speeds
                        if not petSpeeds[petType] then
                            petSpeeds[petType] = {total = 0, count = 0, individual = {}}
                        end
                        petSpeeds[petType].total = petSpeeds[petType].total + speed
                        petSpeeds[petType].count = petSpeeds[petType].count + 1
                        table.insert(petSpeeds[petType].individual, speed)
                        
                        -- Count mutations
                        if mutation ~= "None" and mutation ~= "" then
                            inventory.mutations[mutation] = (inventory.mutations[mutation] or 0) + 1
                        end
                    end
                end
            end
            
            -- Calculate averages
            for petType, speedData in pairs(petSpeeds) do
                speedData.average = speedData.count > 0 and (speedData.total / speedData.count) or 0
            end
            
            inventory.pets = {
                counts = petCounts,
                speeds = petSpeeds
            }
            inventory.totalPets = totalPets
            inventory.placedPets = placedPets
            log("🐾 Found " .. totalPets .. " unplaced pets, " .. placedPets .. " placed pets")
        else
            log("❌ Pets folder not found")
        end
    end)
    
    return inventory
end

-- API Functions
local function makeRequest(endpoint, method, data)
    if not config.token then
        log("No token configured")
        return false, "No token"
    end
    
    local url = config.apiUrl .. endpoint
    local headers = {
        ["Content-Type"] = "application/json",
        ["Authorization"] = "Bearer " .. config.token
    }
    
    local requestData = {
        Url = url,
        Method = method or "GET",
        Headers = headers
    }
    
    if data then
        requestData.Body = HttpService:JSONEncode(data)
    end
    
    local success, response = pcall(function()
        return HttpService:RequestAsync(requestData)
    end)
    
    if not success then
        log("Request failed: " .. tostring(response))
        return false, response
    end
    
    if response.StatusCode >= 200 and response.StatusCode < 300 then
        local responseData = nil
        if response.Body and response.Body ~= "" then
            pcall(function()
                responseData = HttpService:JSONDecode(response.Body)
            end)
        end
        return true, responseData
    else
        log("API error: " .. response.StatusCode .. " - " .. (response.Body or ""))
        return false, response.Body
    end
end

local function syncData()
    if not config.token then
        log("Cannot sync: No token configured")
        return false
    end
    
    log("Starting data sync...")
    
    local playerData = getPlayerData()
    local inventoryData = getInventoryData()
    
    -- Debug logging
    log("Detected data: Pets=" .. (inventoryData.totalPets or 0) .. 
        ", Eggs=" .. (inventoryData.totalEggs or 0) .. 
        ", Coins=" .. (inventoryData.coins or 0) .. 
        ", Gems=" .. (inventoryData.gems or 0))
    
    local syncPayload = {
        player = playerData,
        inventory = inventoryData,
        timestamp = os.time(),
        gameSession = {
            startTime = lastSync == 0 and os.time() or nil,
            duration = lastSync > 0 and (os.time() - lastSync) or 0
        },
        -- Simple format for dashboard compatibility
        gameData = {
            pets = inventoryData.totalPets or 0,
            eggs = inventoryData.totalEggs or 0,
            coins = inventoryData.coins or 0,
            gems = inventoryData.gems or 0
        }
    }
    
    -- Debug logging
    log("📤 Sending payload:")
    log("  Player: " .. (playerData.username or "unknown") .. " (ID: " .. (playerData.userId or "unknown") .. ")")
    log("  Token: " .. (config.token and (config.token:sub(1, 10) .. "...") or "missing"))
    log("  Data: Pets=" .. (inventoryData.totalPets or 0) .. ", Eggs=" .. (inventoryData.totalEggs or 0) .. ", Coins=" .. (inventoryData.coins or 0))
    
    local success, response = makeRequest("/sync", "POST", syncPayload)
    
    if success then
        log("Data synced successfully")
        lastSync = os.time()
        return true
    else
        log("Sync failed: " .. tostring(response))
        return false
    end
end

-- Main Functions
function WebsiteSync.Init(options)
    options = options or {}
    
    -- Update configuration
    if options.token then config.token = options.token end
    if options.apiUrl then config.apiUrl = options.apiUrl end
    if options.syncInterval then config.syncInterval = options.syncInterval end
    if options.debug ~= nil then config.debug = options.debug end
    if options.autoStart ~= nil then config.autoStart = options.autoStart end
    
    log("WebsiteSync initialized")
    log("API URL: " .. config.apiUrl)
    log("Sync Interval: " .. config.syncInterval .. " seconds")
    log("Token: " .. (config.token and "Set" or "Not Set"))
    
    -- Auto-start if enabled
    if config.autoStart and config.token then
        WebsiteSync.Start()
    end
    
    return true
end

function WebsiteSync.Start()
    if isRunning then
        log("Already running")
        return false
    end
    
    if not config.token then
        log("❌ No token set! Please configure your token first.")
        log("📝 Use: WebsiteSync.SetToken('your_token_here')")
        log("🎫 Get token from: https://zebux.up.railway.app/token")
        return false
    end
    
    log("Starting sync service...")
    isRunning = true
    lastSync = 0
    
    -- Initial sync
    task.spawn(function()
        task.wait(2) -- Wait a bit for game to load
        syncData()
    end)
    
    -- Periodic sync
    syncConnection = task.spawn(function()
        while isRunning do
            task.wait(config.syncInterval)
            if isRunning then
                syncData()
            end
        end
    end)
    
    log("Sync service started")
    return true
end

function WebsiteSync.Stop()
    if not isRunning then
        log("Not running")
        return false
    end
    
    log("Stopping sync service...")
    isRunning = false
    
    if syncConnection then
        task.cancel(syncConnection)
        syncConnection = nil
    end
    
    log("Sync service stopped")
    return true
end

function WebsiteSync.SyncNow()
    if not config.token then
        log("Cannot sync: No token configured")
        return false
    end
    
    return syncData()
end

function WebsiteSync.SetToken(token)
    config.token = token
    log("Token updated")
end

function WebsiteSync.SetApiUrl(url)
    config.apiUrl = url
    log("API URL updated: " .. url)
end

function WebsiteSync.GetStatus()
    return {
        running = isRunning,
        lastSync = lastSync,
        token = config.token and "Set" or "Not Set",
        apiUrl = config.apiUrl,
        syncInterval = config.syncInterval
    }
end

function WebsiteSync.GetConfig()
    return {
        token = config.token,
        apiUrl = config.apiUrl,
        syncInterval = config.syncInterval,
        debug = config.debug,
        autoStart = config.autoStart
    }
end

-- Cleanup on game close
game:BindToClose(function()
    if isRunning then
        -- Final sync before closing
        pcall(function()
            syncData()
        end)
        WebsiteSync.Stop()
    end
end)

return WebsiteSync
