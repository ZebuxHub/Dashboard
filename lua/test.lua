-- =====================================================================================
-- Services and Environment
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local LocalPlayer = Players.LocalPlayer

-- Defensive nil checks: This script is meant to be executed in-game
if not LocalPlayer then
	return warn("[Kaitun] LocalPlayer not found; aborting")
end

-- Remotes (cached with soft timeouts)
local Remotes = ReplicatedStorage:FindFirstChild("Remote")
local CharacterRE = Remotes and Remotes:FindFirstChild("CharacterRE")
local ConveyorRE = Remotes and Remotes:FindFirstChild("ConveyorRE")
local PetRE = Remotes and Remotes:FindFirstChild("PetRE")
local FoodStoreRE = Remotes and Remotes:FindFirstChild("FoodStoreRE")

-- =====================================================================================
-- Config handling
local function readConfig()
    local cfg = nil
    if getgenv then
        cfg = getgenv().Configuration or getgenv().Configurations
    end
    cfg = cfg or {}
	local defaults = {
		Enabled = true,
        ["Farm Eggs"] = {}, -- legacy
		["Equip Pets"] = {},
		["Auto Sell Pets"] = false,
		["Sell Pets"] = {},
        ["Feed Pets"] = true,
		["Sell Pet Min Count"] = 5,
		["UgardePetSlot"] = true,
		["UpgradeEggSlot"] = true,
        AutoBuy = true,
        AutoPlace = true,
        AutoHatch = true,
        AutoUnlock = true,
        AutoUpgrade = true, -- new schema
        AutoUpgradeConveyor = true, -- legacy alias
        AutoClaim = true,
        AutoDeploy = true,
		PreferMutations = { "Golden", "Diamond", "Electirc", "Fire", "Jurassic" },
		MoneyReserve = 0,
		Debug = true,
        UpgradeTier = 9,
        UpgradeConfig = {},
        EggPriority = {},
        MutationPriority = {},
        RequireMutation = false,
		PlaceEggTypes = {},
		PlaceMutations = {},
		PlaceRequireMutation = false,
		-- Auto sell by mutation or speed
		AutoSell = false,
		SellPetSpeedBelow = 0,
		SellPetMutations = {},
		SellEggMutations = {},
		WebhookEnabled = false,
		WebhookUrl = "",
		WebhookInventoryEverySeconds = 60,
		AutoClaimDelaySeconds = 0.25,
	}
	for k, v in pairs(defaults) do
		if cfg[k] == nil then cfg[k] = v end
	end
    -- normalize aliases
    if cfg.AutoUpgradeConveyor == nil and cfg.AutoUpgrade ~= nil then
        cfg.AutoUpgradeConveyor = cfg.AutoUpgrade
    end
    -- purge legacy delete keys if present (no-op now)
    cfg.AutoDelete = nil
    cfg.DeletePetSpeedBelow = nil
    cfg.DeletePetMutations = nil
    cfg.DeleteEggMutations = nil
	return cfg
end

local Config = readConfig()

local function logDebug(...)
    if not Config.Debug then return end
    local args = {...}
    pcall(function()
        print("[Kaitun][DBG]", table.unpack(args))
    end)
end

-- =====================================================================================
-- Utility helpers
local function getPlayerNetWorth()
	local attrValue = LocalPlayer:GetAttribute("NetWorth")
	if type(attrValue) == "number" then return attrValue end
	local leaderstats = LocalPlayer:FindFirstChild("leaderstats")
	if leaderstats then
		local netWorthValue = leaderstats:FindFirstChild("NetWorth")
		if netWorthValue and type(netWorthValue.Value) == "number" then
			return netWorthValue.Value
		end
	end
	return 0
end

local function getAssignedIslandName()
	local ok, name = pcall(function()
		return LocalPlayer:GetAttribute("AssignedIslandName")
	end)
	return ok and name or nil
end

local function getIslandNumberFromName(islandName)
	if not islandName then return nil end
	local match = string.match(islandName, "Island_(%d+)")
	if match then return tonumber(match) end
	match = string.match(islandName, "(%d+)")
	if match then return tonumber(match) end
	return nil
end

-- =====================================================================================
-- Egg/Pet containers and attributes
local function getEggContainer()
	local pg = LocalPlayer:FindFirstChild("PlayerGui")
	local data = pg and pg:FindFirstChild("Data")
	return data and data:FindFirstChild("Egg") or nil
end

local function listAvailableEggUIDs()
	local container = getEggContainer()
	local list = {}
	if not container then return list end
	for _, node in ipairs(container:GetChildren()) do
		if #node:GetChildren() == 0 then
			local eggType = node:GetAttribute("T") or node:GetAttribute("Type") or node:GetAttribute("EggType")
            local mutation = node:GetAttribute("M")
            if mutation == "Dino" then mutation = "Jurassic" end
            list[#list+1] = { uid = node.Name, type = eggType and tostring(eggType) or node.Name, mutation = mutation and tostring(mutation) or nil }
		end
	end
	return list
end

-- =====================================================================================
-- Farm tiles (regular and water) and occupancy detection
local OCEAN_EGGS = {
	["SeaweedEgg"] = true, ["ClownfishEgg"] = true, ["LionfishEgg"] = true, ["SharkEgg"] = true,
	["AnglerfishEgg"] = true, ["OctopusEgg"] = true, ["SeaDragonEgg"] = true,
}

local function isOceanEgg(eggType)
	return eggType and OCEAN_EGGS[tostring(eggType)] == true
end

local function findIsland()
	local art = workspace:FindFirstChild("Art")
	if not art then return nil end
	local islandName = getAssignedIslandName()
	if not islandName then return nil end
	return art:FindFirstChild(islandName)
end

local function collectFarmParts(island, isWater)
	local parts = {}
	if not island then return parts end
	local function scan(node)
		for _, child in ipairs(node:GetChildren()) do
			if child:IsA("BasePart") then
				if isWater then
					if child.Name == "WaterFarm_split_0_0_0" and child.Size == Vector3.new(8, 8, 8) and child.CanCollide then
						parts[#parts+1] = child
					end
				else
					if child.Name:match("^Farm_split_%d+_%d+_%d+$") and child.Size == Vector3.new(8, 8, 8) and child.CanCollide then
						parts[#parts+1] = child
					end
				end
			end
			scan(child)
		end
	end
	scan(island)
	return parts
end

local function getLockedAreas(island)
	local out = {}
	local env = island and island:FindFirstChild("ENV")
	local locks = env and env:FindFirstChild("Locks")
	if not locks then return out end
	for _, lockModel in ipairs(locks:GetChildren()) do
		if lockModel:IsA("Model") then
			local farmPart = lockModel:FindFirstChild("Farm")
			if farmPart and farmPart:IsA("BasePart") and farmPart.Transparency == 0 then
				out[#out+1] = { position = farmPart.Position, size = farmPart.Size, farmPart = farmPart, model = lockModel }
			end
		end
	end
	return out
end

local function isWithinArea(pos, area)
	local center, size = area.position, area.size
	local half = size/2
	return pos.X >= center.X - half.X and pos.X <= center.X + half.X and pos.Z >= center.Z - half.Z and pos.Z <= center.Z + half.Z
end

local function filterUnlocked(parts, island)
	local areas = getLockedAreas(island)
	if #areas == 0 then return parts end
	local out = {}
	for _, p in ipairs(parts) do
		local locked = false
		for _, a in ipairs(areas) do
			if isWithinArea(p.Position, a) then locked = true break end
		end
		if not locked then out[#out+1] = p end
	end
	return out
end

local function isTileOccupied(farmPart)
	local tileCenter = farmPart.Position
	local surface = Vector3.new(
		math.floor(tileCenter.X/8)*8 + 4,
		tileCenter.Y + 12,
		math.floor(tileCenter.Z/8)*8 + 4
	)
	local pbb = workspace:FindFirstChild("PlayerBuiltBlocks")
	if pbb then
		for _, model in ipairs(pbb:GetChildren()) do
			if model:IsA("Model") then
				local mp = model:GetPivot().Position
				local xz = ((mp.X - surface.X)^2 + (mp.Z - surface.Z)^2)^0.5
				local y = math.abs(mp.Y - surface.Y)
				if xz < 4.0 and y < 12.0 then return true end
			end
		end
	end
	local pets = workspace:FindFirstChild("Pets")
	if pets then
		for _, pet in ipairs(pets:GetChildren()) do
			if pet:IsA("Model") then
				local pp = pet:GetPivot().Position
				local xz = ((pp.X - surface.X)^2 + (pp.Z - surface.Z)^2)^0.5
				local y = math.abs(pp.Y - surface.Y)
				if xz < 4.0 and y < 12.0 then return true end
			end
		end
	end
	return false
end

local function countAvailableTiles(isWater)
	local island = findIsland()
	if not island then return 0, {}, {} end
	local raw = collectFarmParts(island, isWater)
	local unlocked = filterUnlocked(raw, island)
	local available = {}
	for _, part in ipairs(unlocked) do
		if not isTileOccupied(part) then
			available[#available+1] = part
		end
	end
	return #available, available, unlocked
end

-- =====================================================================================
-- Conveyor scanning and egg buying
local function getConveyorBelts()
	local island = findIsland()
	if not island then return {} end
	local env = island:FindFirstChild("ENV")
	local root = env and env:FindFirstChild("Conveyor")
	if not root then return {} end
	local belts = {}
	for i = 1, 9 do
		local c = root:FindFirstChild("Conveyor" .. i)
		local b = c and c:FindFirstChild("Belt")
		if b then belts[#belts+1] = b end
	end
	return belts
end

-- Parse number with K/M/B/T suffixes (also reused for speeds)
local function parseNumberWithSuffix(text)
    if not text then return nil end
    if type(text) == "number" then return text end
    local cleanText = tostring(text):gsub("[$€£¥₹/s,]", ""):gsub("^%s*(.-)%s$", "%1")
    local number, suffix = cleanText:match("^([%d%.]+)([KkMmBbTt]?)$")
    if not number then number = cleanText:match("([%d%.]+)") end
    local numValue = tonumber(number)
    if not numValue then return nil end
    if suffix and suffix ~= "" then
        local s = suffix:lower()
        if s == "k" then numValue = numValue * 1e3
        elseif s == "m" then numValue = numValue * 1e6
        elseif s == "b" then numValue = numValue * 1e9
        elseif s == "t" then numValue = numValue * 1e12 end
    end
    return numValue
end

local function parsePriceFromGUI(model)
	local rootPart = model:FindFirstChild("RootPart")
	if not rootPart then return nil end
	local paths = { "GUI/EggGUI", "EggGUI", "GUI", "Gui" }
	for _, path in ipairs(paths) do
		local gui = rootPart:FindFirstChild(path)
		if gui then
			for _, name in ipairs({"Price","PriceLabel","Cost","CostLabel"}) do
				local lbl = gui:FindFirstChild(name)
				if lbl and lbl:IsA("TextLabel") then
					local t = lbl.Text
					if t and t ~= "" then
						local numStr = t:gsub("[^%d%.KMBkmb]", "")
						if numStr ~= "" then
							local num = tonumber(numStr:match("([%d%.]+)"))
							if num then
								local s = numStr:match("[KMBkmb]")
								if s then
									s = s:lower()
									if s == "k" then num = num * 1e3
									elseif s == "m" then num = num * 1e6
									elseif s == "b" then num = num * 1e9 end
								end
								return num
							end
						end
					end
				end
			end
		end
	end
	return nil
end

local function getEggTypeFromModel(model)
    local eggType = model:GetAttribute("Type") or model:GetAttribute("EggType") or model:GetAttribute("Name")
    return eggType and tostring(eggType) or nil
end

local function buyEggByUID(eggUID)
	if not CharacterRE then return false end
	local ok = pcall(function()
		CharacterRE:FireServer("BuyEgg", eggUID)
		CharacterRE:FireServer("Focus", eggUID)
	end)
	return ok
end

-- =====================================================================================
-- Placing and hatching
local function focusEgg(eggUID)
	if not CharacterRE then return false end
	local ok = pcall(function()
		CharacterRE:FireServer("Focus", eggUID)
	end)
	return ok
end

local function placeEggAtTile(farmPart, eggUID)
	if not farmPart or not eggUID or not CharacterRE then return false end
	local c = farmPart.Position
	local surface = Vector3.new(
		math.floor(c.X/8)*8 + 4,
		c.Y + (farmPart.Size.Y/2),
		math.floor(c.Z/8)*8 + 4
	)
	local vector = { create = function(x, y, z) return Vector3.new(x, y, z) end }
	local ok = pcall(function()
		CharacterRE:FireServer("Place", { DST = vector.create(surface.X, surface.Y, surface.Z), ID = eggUID })
	end)
	return ok
end

-- Prevent spamming the same egg UID
local hatchInFlightByUid = {}

local function hatchEggDirectly(eggUID)
    local pbb = workspace:FindFirstChild("PlayerBuiltBlocks")
    if not pbb then return false end
    local model = pbb:FindFirstChild(eggUID)
    if not (model and model:IsA("Model")) then return false end
	-- simple per-UID throttle
	local now = os.clock()
	local last = hatchInFlightByUid[eggUID]
	if last and (now - last) < 0.8 then return false end
	hatchInFlightByUid[eggUID] = now
    local function findRF(m)
        if not m then return nil end
        local root = m:FindFirstChild("RootPart")
        if root then
            local rf = root:FindFirstChild("RF")
            if rf then return rf end
        end
        -- Search any descendant BasePart with RF
        for _, d in ipairs(m:GetDescendants()) do
            if d:IsA("BasePart") then
                local rf = d:FindFirstChild("RF")
                if rf then return rf end
            elseif d.Name == "RF" then
                return d
            end
        end
        return nil
    end
    -- Try to focus before hatching (helps in some ocean cases)
    pcall(function()
        if CharacterRE then CharacterRE:FireServer("Focus", eggUID) end
    end)
    local rf = findRF(model)
    if not rf then return false end
    local ok = pcall(function()
        rf:InvokeServer("Hatch")
    end)
    return ok
end

-- =====================================================================================
-- Unlocking tiles
local function getLockedTiles(island)
    local out = {}
    local env = island and island:FindFirstChild("ENV")
    local locks = env and env:FindFirstChild("Locks")
    if not locks then return out end
    for _, lockModel in ipairs(locks:GetChildren()) do
        if lockModel:IsA("Model") then
            -- Prefer a child named "Farm", else support "WaterFarm", else any BasePart descendant
            local farmPart = lockModel:FindFirstChild("Farm")
            if not (farmPart and farmPart:IsA("BasePart")) then
                farmPart = lockModel:FindFirstChild("WaterFarm") or farmPart
                if not (farmPart and farmPart:IsA("BasePart")) then
                    for _, ch in ipairs(lockModel:GetDescendants()) do
                        if ch:IsA("BasePart") then farmPart = ch break end
                    end
                end
            end
            if farmPart and farmPart:IsA("BasePart") then
                -- Consider locked if visible blocker is opaque or collidable
                local isLocked = (tonumber(farmPart.Transparency) or 0) <= 0.01 or (farmPart.CanCollide == true)
                if isLocked then
                    local lockCost = farmPart:GetAttribute("LockCost") or lockModel:GetAttribute("LockCost") or farmPart:GetAttribute("Cost") or 0
                    out[#out+1] = { modelName = lockModel.Name, farmPart = farmPart, cost = lockCost, model = lockModel }
                end
            end
        end
    end
    return out
end

local function unlockTile(lockInfo)
	if not (CharacterRE and lockInfo and lockInfo.farmPart) then return false end
	local ok = pcall(function()
		CharacterRE:FireServer("Unlock", lockInfo.farmPart)
	end)
	return ok
end

-- =====================================================================================
-- Conveyor upgrade
local function getCurrentConveyorLevel()
	local playerGui = LocalPlayer:FindFirstChild("PlayerGui")
	if not playerGui then return 0 end
	local data = playerGui:FindFirstChild("Data")
	if not data then return 0 end
	local gameFlag = data:FindFirstChild("GameFlag")
	if not gameFlag then return 0 end
	local level = tonumber(gameFlag:GetAttribute("Conveyor")) or 0
	return level
end

local function fireConveyorUpgrade(index)
	if not ConveyorRE then return false end
	local ok = pcall(function()
		ConveyorRE:FireServer("Upgrade", tonumber(index) or index)
	end)
	return ok
end

-- =====================================================================================
-- Anti-AFK fallback
local antiAFKConnection
local function enableFallbackAntiAFK()
	if antiAFKConnection then return end
	local vu = game:GetService("VirtualUser")
	antiAFKConnection = LocalPlayer.Idled:Connect(function()
		vu:Button2Down(Vector2.new(0,0), workspace.CurrentCamera.CFrame)
		task.wait(1)
		vu:Button2Up(Vector2.new(0,0), workspace.CurrentCamera.CFrame)
	end)
end

-- =====================================================================================
-- Background loops
local running = false

-- Forward declaration for functions used before definition
local getInventoryUnplacedCandidates
local placeUnitAtTile
local isOceanPetByUid
local sellPet

local function runAutoBuy()
	while running do
		local cfg = readConfig()
        if not (cfg.Enabled and cfg.AutoBuy) then
            task.wait(1)
        else
            -- Map egg priorities by name
            local priorityItems = {}
            local priorityMap = {}
            for _, item in ipairs(cfg.EggPriority or {}) do
                if item and item.Name then
                    table.insert(priorityItems, item)
                    priorityMap[item.Name] = item
                end
            end
            table.sort(priorityItems, function(a, b)
                local pa = tonumber(a.Priority) or 999
                local pb = tonumber(b.Priority) or 999
                return pa < pb
            end)
            local belts = getConveyorBelts()
            if #belts == 0 then
                task.wait(2)
            else
                local netWorth = getPlayerNetWorth()
                local mutationPriority = {}
                for i, m in ipairs(cfg.MutationPriority or {}) do
                    mutationPriority[tostring(m)] = #cfg.MutationPriority - i + 1
                end
                -- Build priorityMap only if EggPriority configured; otherwise fallback to mutation-only mode
                local priorityItems = {}
                local priorityMap = {}
                for _, item in ipairs(cfg.EggPriority or {}) do
                    if item and item.Name then
                        table.insert(priorityItems, item)
                        priorityMap[item.Name] = item
                    end
                end
                for _, belt in ipairs(belts) do
                    for _, child in ipairs(belt:GetChildren()) do
                        if child:IsA("Model") then
                            local eggType = getEggTypeFromModel(child)
                            local item = eggType and priorityMap[eggType] or nil
                            -- Fallback: if no EggPriority configured at all, allow by default (mutation-only mode)
                            local allowByType = (next(priorityMap) == nil) or (item ~= nil)
                            if allowByType then
                                local requiredMoney = item and (tonumber(item.Price) or 0) or 0
                                local maxAllowed = item and (tonumber(item.Max) or math.huge) or math.huge
                                local currentCount = item and (tonumber(item.Count) or 0) or 0
                                if netWorth >= requiredMoney and currentCount < maxAllowed then
                                    -- Mutation-aware preference: try to detect mutation from GUI
                                    local rootPart = child:FindFirstChild("RootPart")
                                    local mutScore = 0
                                    local mutName = nil
                                    if rootPart then
                                        local gui = rootPart:FindFirstChild("GUI") or rootPart:FindFirstChild("EggGUI") or rootPart:FindFirstChild("BillboardGui")
                                        if gui then
                                            for _, name in ipairs({"Mutate","Mutation","MutateText","MutationLabel"}) do
                                                local lbl = gui:FindFirstChild(name)
                                                if lbl and lbl:IsA("TextLabel") then
                                                    local mt = tostring(lbl.Text)
                                                    if mt and mt ~= "" and mt ~= "None" then
                                                        mutName = mt
                                                        mutScore = mutationPriority[mt] or 0
                                                        break
                                                    end
                                                end
                                            end
                                        end
                                    end
                                    local allowedToBuy = true
                                    if cfg.RequireMutation and not mutName then
                                        -- Strict mode: skip eggs without visible mutation match
                                        allowedToBuy = false
                                    end
                                    if allowedToBuy then
                                        -- Prioritize mutation eggs first by short delay ordering
                                        task.spawn(function()
                                            if mutScore > 0 then task.wait(0.0) else task.wait(0.08) end
                                            local uid = child.Name
                                            if buyEggByUID(uid) then
                                                logDebug("Bought", uid, "type=", eggType, "mutScore=", mutScore)
                                                if item and getgenv and getgenv().Configuration and getgenv().Configuration.EggPriority then
                                                    for _, ep in ipairs(getgenv().Configuration.EggPriority) do
                                                        if ep.Name == eggType then
                                                            ep.Count = (tonumber(ep.Count) or 0) + 1
                                                        end
                                                    end
                                                end
                                            end
                                        end)
                                    end
                                end
                            end
                        end
                    end
                end
            end
        end
        task.wait(0.5)
	end
end

local function runAutoPlace()
	while running do
		local cfg = readConfig()
        if not (cfg.Enabled and cfg.AutoPlace) then
            task.wait(1)
        else
            local eggs = listAvailableEggUIDs()
            if #eggs == 0 then
                task.wait(1)
            else
                -- Early stop: if no tiles available for both regular and water, pause instead of scanning/focusing
                local regFree = select(1, countAvailableTiles(false))
                local waterFree = select(1, countAvailableTiles(true))
                if regFree == 0 and waterFree == 0 then
                    task.wait(1.5)
                else
                local cfgPlaceTypes = {}
                for _, t in ipairs(readConfig().PlaceEggTypes or {}) do cfgPlaceTypes[tostring(t)] = true end
                local cfgPlaceMuts = {}
                for _, m in ipairs(readConfig().PlaceMutations or {}) do cfgPlaceMuts[tostring(m)] = true end
                for _, egg in ipairs(eggs) do
                    local wantWater = isOceanEgg(egg.type)
                    -- quick per-type skip if current free for that type is zero
                    local typeHasFree = (wantWater and waterFree > 0) or ((not wantWater) and regFree > 0)
                    if typeHasFree then
                    local count, tiles = countAvailableTiles(wantWater)
                    -- If no tiles available at placement time, attempt a quick unlock pass
                    if count == 0 and cfg.AutoUnlock then
                        local island = findIsland()
                        if island then
                            local locked = getLockedTiles(island)
                            table.sort(locked, function(a, b)
                                return (tonumber(a.cost) or 0) < (tonumber(b.cost) or 0)
                            end)
                            local budget = getPlayerNetWorth() - (cfg.MoneyReserve or 0)
                            local unlockedCount = 0
                            for _, info in ipairs(locked) do
                                if unlockedCount >= 2 then break end
                                local cost = tonumber(info.cost) or 0
                                if budget >= cost then
                                    if unlockTile(info) then
                                        logDebug("Unlocked (place flow)", info.modelName, "cost=", cost)
                                        unlockedCount = unlockedCount + 1
                                        budget = getPlayerNetWorth() - (cfg.MoneyReserve or 0)
                                        task.wait(0.3)
                                    end
                                end
                            end
                            -- Re-check tiles after unlock
                            count, tiles = countAvailableTiles(wantWater)
                            -- refresh per-type cache so subsequent eggs skip quickly
                            if wantWater then waterFree = count else regFree = count end
                        end
                    end
                    -- Filters: type and mutation
                    local allowType = (next(cfgPlaceTypes) == nil) or (cfgPlaceTypes[egg.type] == true)
                    local allowMut = true
                    local reqMut = readConfig().PlaceRequireMutation
                    if next(cfgPlaceMuts) ~= nil then
                        if egg.mutation then
                            allowMut = (cfgPlaceMuts[egg.mutation] == true)
                        else
                            allowMut = not reqMut -- if require mutation and none, disallow
                        end
                    elseif reqMut then
                        allowMut = (egg.mutation ~= nil)
                    end
                    if count > 0 and allowType and allowMut then
                        if Config.Debug then
                            print("[PlaceFilter] egg=", egg.uid, "type=", egg.type, "mutation=", tostring(egg.mutation), "allowType=", allowType, "allowMut=", allowMut)
                        end
                        local tile = tiles[math.random(1, #tiles)]
                        if focusEgg(egg.uid) then
                            if placeEggAtTile(tile, egg.uid) then
                                logDebug("Placed", egg.uid, "type=", egg.type)
                                task.wait(0.2)
                            end
                        end
                        -- decrement per-type free estimate
                        if wantWater and waterFree > 0 then waterFree = waterFree - 1 end
                        if (not wantWater) and regFree > 0 then regFree = regFree - 1 end
                    end
                    end -- typeHasFree
                    task.wait(0.05)
                end
                end
            end
        end
        task.wait(0.5)
	end
end

local function runAutoHatch()
	while running do
		local cfg = readConfig()
        if not (cfg.Enabled and cfg.AutoHatch) then
            task.wait(0.6)
        else
            local pbb = workspace:FindFirstChild("PlayerBuiltBlocks")
            if not pbb then
                task.wait(0.6)
            else
                -- Burst hatching: run multiple fast passes, spawning parallel invokes
                local eggs = {}
                for _, model in ipairs(pbb:GetChildren()) do
                    if model:IsA("Model") then
                        eggs[#eggs+1] = model.Name
                    end
                end
                local idx = 1
                local burst = 24 -- higher burst like Premium behavior
                while idx <= #eggs do
                    local endIdx = math.min(#eggs, idx + burst - 1)
                    for i = idx, endIdx do
                        local uid = eggs[i]
                        task.spawn(function()
                            pcall(function()
                                hatchEggDirectly(uid)
                            end)
                        end)
                    end
                    idx = endIdx + 1
                    task.wait(0.05)
                end
            end
            task.wait(0.2)
        end
	end
end

-- =====================================================================================
-- Auto Claim earnings
local function getOwnedPetNames()
    local names = {}
    local playerGui = LocalPlayer and LocalPlayer:FindFirstChild("PlayerGui")
    local data = playerGui and playerGui:FindFirstChild("Data")
    local petsContainer = data and data:FindFirstChild("Pets")
    if petsContainer then
        for _, child in ipairs(petsContainer:GetChildren()) do
            local n
            if child:IsA("ValueBase") then n = tostring(child.Value) else n = tostring(child.Name) end
            if n and n ~= "" then names[#names+1] = n end
        end
    end
    return names
end

local function claimMoneyForPet(petName)
    local petsFolder = workspace:FindFirstChild("Pets")
    if not petsFolder then return false end
    local petModel = petsFolder:FindFirstChild(petName)
    if not petModel then return false end
    local root = petModel:FindFirstChild("RootPart")
    if not root then return false end
    local re = root:FindFirstChild("RE")
    if not re or not re.FireServer then return false end
    local ok = pcall(function()
        re:FireServer("Claim")
    end)
    return ok == true
end

local function runAutoClaim()
    while running do
        local cfg = readConfig()
        if not (cfg.Enabled and cfg.AutoClaim) then
            task.wait(1)
        else
            local names = getOwnedPetNames()
            -- Burst-claim similar to hatch: parallel small bursts
            local idx = 1
            local burst = 32
            while idx <= #names do
                local endIdx = math.min(#names, idx + burst - 1)
                for i = idx, endIdx do
                    local n = names[i]
                    task.spawn(function()
                        pcall(function()
                            claimMoneyForPet(n)
                        end)
                    end)
                end
                idx = endIdx + 1
                task.wait(0.05)
            end
        end
        task.wait(tonumber(readConfig().AutoClaimDelaySeconds) or 0.25)
    end
end

-- Periodic sweep: sell unplaced pets/eggs in inventory matching AutoSell rules
local function runAutoSellSweep()
    while running do
        local cfg = readConfig()
        if not (cfg.Enabled and cfg.AutoSell) then
            task.wait(1.5)
        else
            -- Pets in inventory (unplaced)
            local candidates = getInventoryUnplacedCandidates()
            local speedCut = tonumber(cfg.SellPetSpeedBelow) or 0
            local mutSet = {}
            for _, m in ipairs(cfg.SellPetMutations or {}) do mutSet[tostring(m)] = true end
            for _, it in ipairs(candidates) do
                local doSell = true
                if speedCut > 0 and (tonumber(it.speed) or 0) >= speedCut then
                    doSell = false
                end
                if next(mutSet) ~= nil then
                    local tag = tostring(it.mutation or "None")
                    doSell = (mutSet[tag] == true)
                end
                if doSell then
                    sellPet(it.uid)
                    task.wait(0.05)
                end
            end

            -- Eggs in inventory (unhatched)
            local eggMutSet = {}
            for _, m in ipairs(cfg.SellEggMutations or {}) do eggMutSet[tostring(m)] = true end
            if next(eggMutSet) ~= nil then
                local eggs = listAvailableEggUIDs()
                for _, egg in ipairs(eggs) do
                    local etag = tostring(egg.mutation or "None")
                    if eggMutSet[etag] then
                        sellEggByUid(egg.uid)
                        task.wait(0.05)
                    end
                end
            end

            task.wait(1.0)
        end
    end
end

local function runAutoUnlock()
	while running do
		local cfg = readConfig()
        if not (cfg.Enabled and cfg.AutoUnlock) then
            task.wait(1.5)
        else
            local island = findIsland()
            if not island then
                task.wait(1.5)
            else
                -- Scan regular and water availability separately and more frequently
                local regCount = select(1, countAvailableTiles(false))
                local waterCount = select(1, countAvailableTiles(true))

                local function unlockCheapest(n)
                    local locked = getLockedTiles(island)
                    if #locked == 0 then return false end
                    table.sort(locked, function(a, b)
                        return (tonumber(a.cost) or 0) < (tonumber(b.cost) or 0)
                    end)
                    local budget = getPlayerNetWorth() - (cfg.MoneyReserve or 0)
                    local unlockedCount = 0
                    for _, info in ipairs(locked) do
                        if unlockedCount >= n then break end
                        local cost = tonumber(info.cost) or 0
                        if budget >= cost then
                            if unlockTile(info) then
                                logDebug("Unlocked tile", info.modelName, "cost=", cost)
                                unlockedCount = unlockedCount + 1
                                budget = getPlayerNetWorth() - (cfg.MoneyReserve or 0)
                                task.wait(0.25)
                            end
                        end
                    end
                    return unlockedCount > 0
                end

                local didUnlock = false
                if regCount == 0 then didUnlock = unlockCheapest(2) or didUnlock end
                if waterCount == 0 then didUnlock = unlockCheapest(2) or didUnlock end

                if not didUnlock and regCount > 0 and waterCount > 0 then
                    task.wait(1.0)
                end
            end
            task.wait(0.6)
        end
	end
end

local function runAutoUpgrade()
	while running do
		local cfg = readConfig()
        if not (cfg.Enabled and cfg.AutoUpgradeConveyor) then
            task.wait(2)
        else
            local lvl = getCurrentConveyorLevel()
            local targetTier = tonumber(cfg.UpgradeTier) or 9
            if lvl >= targetTier then
                task.wait(2)
            else
                local before = getPlayerNetWorth()
                local nextLevel = math.min(lvl + 1, targetTier)
                local required = 0
                if cfg.UpgradeConfig and cfg.UpgradeConfig[nextLevel] then
                    required = tonumber(cfg.UpgradeConfig[nextLevel]) or 0
                end
                if before <= math.max(required, (cfg.MoneyReserve or 0)) then
                    task.wait(2)
                else
                    fireConveyorUpgrade(nextLevel)
                    logDebug("Tried upgrading conveyor to", nextLevel)
                end
            end
            task.wait(3)
        end
	end
end

-- Optional: Auto Feed via external module (GitHub version)
local function runAutoFeed()
    -- If per-slot feed mapping is configured, skip external module and use local logic
    local function hasSlotMap()
        local cfg = readConfig()
        return type(cfg.FeedSlots) == "table" and next(cfg.FeedSlots) ~= nil
    end

    -- Helpers for local feeding
    local function equipFruit(fruitName)
        if not fruitName or not CharacterRE then return false end
        local candidates = {}
        table.insert(candidates, fruitName)
        local lower = string.lower(fruitName)
        local upper = string.upper(fruitName)
        table.insert(candidates, lower)
        table.insert(candidates, upper)
        local underscored = tostring(fruitName):gsub(" ", "_")
        table.insert(candidates, underscored)
        table.insert(candidates, string.lower(underscored))
        for _, key in ipairs(candidates) do
            local ok = pcall(function()
                CharacterRE:FireServer("Focus", key)
            end)
            if ok then return true end
        end
        return false
    end

    local function feedPetByName(petName)
        if not PetRE then return false end
        local ok = pcall(function()
            PetRE:FireServer("Feed", petName)
        end)
        return ok == true
    end

    local function isBigPetReady(petModel)
        local root = petModel and petModel:FindFirstChild("RootPart")
        local bigPetGUI = root and root:FindFirstChild("GUI/BigPetGUI")
        if not bigPetGUI then return false end
        local feedGUI = bigPetGUI:FindFirstChild("Feed")
        if not feedGUI then return false end
        local feedText = feedGUI:FindFirstChild("TXT")
        local txt = (feedText and feedText:IsA("TextLabel")) and (feedText.Text or "") or ""
        -- Ready if feed panel hidden or shows zero-ish text
        if not feedGUI.Visible then return true end
        if txt == "00:00" or txt == "" or txt == "???" then return true end
        return false
    end

    local function getOrderedBigPets()
        local pets = {}
        local petsFolder = workspace:FindFirstChild("Pets")
        if not petsFolder then return pets end
        local myUserId = LocalPlayer.UserId
        for _, pet in ipairs(petsFolder:GetChildren()) do
            if pet:IsA("Model") then
                local uidAttr = pet:GetAttribute("UserId")
                if uidAttr and tonumber(uidAttr) == myUserId then
                    local root = pet:FindFirstChild("RootPart")
                    local bigPetGUI = root and root:FindFirstChild("GUI/BigPetGUI")
                    if bigPetGUI then
                        table.insert(pets, pet)
                    end
                end
            end
        end
        table.sort(pets, function(a,b) return a.Name < b.Name end)
        return pets
    end

    while running do
        local cfg = readConfig()
        if not (cfg.Enabled and cfg["Feed Pets"]) then
            task.wait(2)
        else
            if hasSlotMap() then
                local slotMap = cfg.FeedSlots
                local bigPets = getOrderedBigPets()
                for slotIndex = 1, 3 do
                    local fruit = slotMap[slotIndex]
                    local pet = bigPets[slotIndex]
                    if fruit and pet and isBigPetReady(pet) then
                        if equipFruit(fruit) then
                            task.wait(0.2)
                            feedPetByName(pet.Name)
                            task.wait(0.5)
                        end
                    end
                end
            else
                -- Fallback to external AutoFeedSystem if no per-slot map provided
                local AutoFeedSystem = nil
                pcall(function()
                    AutoFeedSystem = loadstring(game:HttpGet("https://raw.githubusercontent.com/ZebuxHub/Main/refs/heads/main/AutoFeedSystem.lua"))()
                end)
                if AutoFeedSystem then
                    local feedStatus = { petsFound = 0, availablePets = 0, totalFeeds = 0, lastAction = "" }
                    local function noop() end
                    local function getSelected()
                        local out = {}
                        local sel = (getgenv and getgenv().Configuration and getgenv().Configuration["Feed Fruits"]) or {}
                        for _, f in ipairs(sel) do out[f] = true end
                        return out
                    end
                    pcall(function()
                        AutoFeedSystem.runAutoFeed(true, feedStatus, noop, getSelected)
                    end)
                end
            end
        end
        task.wait(1)
    end
end

-- =====================================================================================
-- Parabolic auto optimization: pick up below-average pets, sell, and optionally redeploy better ones
local function getPlacedPetsWithSpeeds()
    local result = {}
    local petsFolder = workspace:FindFirstChild("Pets")
    if not petsFolder then return result end
    local myUserId = LocalPlayer.UserId
    for _, pet in ipairs(petsFolder:GetChildren()) do
        if pet:IsA("Model") then
            local uidAttr = pet:GetAttribute("UserId")
            if uidAttr and tonumber(uidAttr) == myUserId then
                local root = pet:FindFirstChild("RootPart")
                if root then
                    -- Use the same parsing approach as AutoSellSystem: prefer UI value under ScreenStorage
                    local speed = 0
                    do
                        local pg = LocalPlayer and LocalPlayer:FindFirstChild("PlayerGui")
                        local ss = pg and pg:FindFirstChild("ScreenStorage")
                        local frame = ss and ss:FindFirstChild("Frame")
                        local cp = frame and frame:FindFirstChild("ContentPet")
                        local sf = cp and cp:FindFirstChild("ScrollingFrame")
                        local item = sf and sf:FindFirstChild(pet.Name)
                        local btn = item and item:FindFirstChild("BTN")
                        local stat = btn and btn:FindFirstChild("Stat")
                        local price = stat and stat:FindFirstChild("Price")
                        local valueLabel = price and price:FindFirstChild("Value")
                        local txt = valueLabel and valueLabel:IsA("TextLabel") and valueLabel.Text or (price and price:IsA("TextLabel") and price.Text)
                        local parsed = parseNumberWithSuffix(txt)
                        if parsed and parsed > 0 then speed = parsed end
                    end
                    if speed == 0 then
                        -- Fallback to IdleGUI/Speed label if ScreenStorage missing
                        local idleGUI = root:FindFirstChild("GUI/IdleGUI", true)
                        local speedLabel = idleGUI and idleGUI:FindFirstChild("Speed")
                        if speedLabel and speedLabel:IsA("TextLabel") then
                            local parsed = parseNumberWithSuffix(speedLabel.Text)
                            if parsed then speed = parsed end
                        end
                    end
                    result[#result+1] = { name = pet.Name, model = pet, speed = speed or 0 }
                end
            end
        end
    end
    return result
end

getInventoryUnplacedCandidates = function()
    local out = {}
    local pg = LocalPlayer and LocalPlayer:FindFirstChild("PlayerGui")
    local data = pg and pg:FindFirstChild("Data")
    local pets = data and data:FindFirstChild("Pets")
    if not pets then return out end
    local screen = pg and pg:FindFirstChild("ScreenStorage")
    local frame = screen and screen:FindFirstChild("Frame")
    local content = frame and frame:FindFirstChild("ContentPet")
    local scroll = content and content:FindFirstChild("ScrollingFrame")
    for _, node in ipairs(pets:GetChildren()) do
        local dAttr = node:GetAttribute("D")
        local unplaced = (dAttr == nil or tostring(dAttr) == "")
        if unplaced then
             -- Skip big pets in inventory (do not auto-deploy/sell)
            local isBig = (node:GetAttribute("BPT") ~= nil) or (node:GetAttribute("BPV") ~= nil)
            if not isBig then
                local item = scroll and scroll:FindFirstChild(node.Name)
                local btn = item and item:FindFirstChild("BTN")
                local stat = btn and btn:FindFirstChild("Stat")
                local price = stat and stat:FindFirstChild("Price")
                local valueLabel = price and price:FindFirstChild("Value")
                local txt = valueLabel and valueLabel:IsA("TextLabel") and valueLabel.Text or (price and price:IsA("TextLabel") and price.Text)
                local speed = parseNumberWithSuffix(txt) or 0
                local mut = node:GetAttribute("M")
                if mut == "Dino" then mut = "Jurassic" end
                out[#out+1] = { uid = node.Name, speed = speed, mutation = mut }
            end
        end
    end
    table.sort(out, function(a, b) return a.speed > b.speed end)
    return out
end

-- Place highest-speed unplaced pets into available tiles first (fill-up phase)
local function fillTilesWithBestPets()
    local candidates = getInventoryUnplacedCandidates()
    if #candidates == 0 then return end
    -- Precompute tile lists for both types
    local regCount, regTiles = countAvailableTiles(false)
    local waterCount, waterTiles = countAvailableTiles(true)
    local i = 1
    while i <= #candidates do
        local cand = candidates[i]
        local wantWater = isOceanPetByUid(cand.uid)
        if wantWater and waterCount > 0 then
            local tile = waterTiles[waterCount]
            if tile and placeUnitAtTile(tile, cand.uid) then
                waterTiles[waterCount] = nil
                waterCount = waterCount - 1
                table.remove(candidates, i)
                task.wait(0.05)
            else
                i = i + 1
            end
        elseif (not wantWater) and regCount > 0 then
            local tile = regTiles[regCount]
            if tile and placeUnitAtTile(tile, cand.uid) then
                regTiles[regCount] = nil
                regCount = regCount - 1
                table.remove(candidates, i)
                task.wait(0.05)
            else
                i = i + 1
            end
        else
            i = i + 1
        end
        if regCount <= 0 and waterCount <= 0 then break end
    end
end

-- Try to place any egg that fits the farm type. Returns true if placed one.
local function placeAnyEggForType(wantWater)
    local eggs = listAvailableEggUIDs()
    if #eggs == 0 then return false end
    -- Build tile cache for target type
    local count, tiles = countAvailableTiles(wantWater)
    if count <= 0 then return false end
    for _, egg in ipairs(eggs) do
        local eggIsWater = isOceanEgg(egg.type)
        if eggIsWater == wantWater then
            local tile = tiles[count]
            if tile and focusEgg(egg.uid) and placeEggAtTile(tile, egg.uid) then
                return true
            end
        end
    end
    return false
end

-- Ensure at least one tile exists for target type by unlocking iteratively
local function ensureTileForType(wantWater)
    local cfg = readConfig()
    local count = select(1, countAvailableTiles(wantWater))
    if count > 0 then return true end
    if not cfg.AutoUnlock then return false end
    local island = findIsland()
    if not island then return false end
    local unlocked = true
    local safety = 0
    while count <= 0 and unlocked and safety < 5 do
        safety = safety + 1
        unlocked = false
        local locked = getLockedTiles(island)
        table.sort(locked, function(a, b)
            return (tonumber(a.cost) or 0) < (tonumber(b.cost) or 0)
        end)
        local budget = getPlayerNetWorth() - (cfg.MoneyReserve or 0)
        local opened = 0
        for _, info in ipairs(locked) do
            if opened >= (cfg.UnlockBatch or 2) then break end
            local cost = tonumber(info.cost) or 0
            if budget >= cost then
                if unlockTile(info) then
                    opened = opened + 1
                    unlocked = true
                    budget = getPlayerNetWorth() - (cfg.MoneyReserve or 0)
                    task.wait(0.2)
                end
            end
        end
        count = select(1, countAvailableTiles(wantWater))
    end
    return count > 0
end

local function averageSpeed(list)
    local sum, n = 0, 0
    for _, item in ipairs(list) do
        sum = sum + (tonumber(item.speed) or 0)
        n = n + 1
    end
    if n == 0 then return 0 end
    return sum / n
end

local function pickUpPet(uid)
    if not CharacterRE then return false end
    local ok = pcall(function()
        CharacterRE:FireServer("Del", uid)
    end)
    return ok == true
end

function sellPet(uid)
    if not PetRE then return false end
    local ok = pcall(function()
        PetRE:FireServer("Sell", uid)
    end)
    return ok == true
end

function sellEggByUid(eggUid)
    if not PetRE then return false end
    local ok = pcall(function()
        PetRE:FireServer("Sell", eggUid, true)
    end)
    return ok == true
end

function placeUnitAtTile(farmPart, uid)
    return placeEggAtTile(farmPart, uid)
end

local OCEAN_KEYWORDS = { "fish","shark","octopus","sea","angler","dolphin","whale","manta","turtle","eel","seal","ray" }
function isOceanPetByUid(uid)
    local pg = LocalPlayer and LocalPlayer:FindFirstChild("PlayerGui")
    local data = pg and pg:FindFirstChild("Data")
    local pets = data and data:FindFirstChild("Pets")
    local node = pets and pets:FindFirstChild(uid)
    local t = node and node:GetAttribute("T")
    local s = t and tostring(t):lower() or tostring(uid):lower()
    for _, kw in ipairs(OCEAN_KEYWORDS) do
        if string.find(s, kw) then return true end
    end
    return false
end

local function runAutoOptimizePets()
    while running do
        local cfg = readConfig()
        if not (cfg.Enabled) then
            task.wait(2)
        else
            -- 1) Fill all free tiles with best unplaced pets first
            fillTilesWithBestPets()

            -- 2) Enforce mutation compliance regardless of capacity
            do
                local cfgPlaceMuts = {}
                for _, m in ipairs(readConfig().PlaceMutations or {}) do cfgPlaceMuts[tostring(m)] = true end
                local requireMut = readConfig().PlaceRequireMutation
                if next(cfgPlaceMuts) ~= nil or requireMut then
                    local placedNow = getPlacedPetsWithSpeeds()
                    for _, pet in ipairs(placedNow) do
                        -- skip big
                        local isBigPlaced = false
                        do
                            local pg = LocalPlayer and LocalPlayer:FindFirstChild("PlayerGui")
                            local data = pg and pg:FindFirstChild("Data")
                            local petsCfg = data and data:FindFirstChild("Pets")
                            local conf = petsCfg and petsCfg:FindFirstChild(pet.name)
                            if conf then
                                local bpt = conf:GetAttribute("BPT")
                                local bpv = conf:GetAttribute("BPV")
                                if bpt ~= nil or bpv ~= nil then isBigPlaced = true end
                            end
                        end
                        if not isBigPlaced then
                            -- read mutation from config
                            local pg = LocalPlayer and LocalPlayer:FindFirstChild("PlayerGui")
                            local data = pg and pg:FindFirstChild("Data")
                            local petsCfg = data and data:FindFirstChild("Pets")
                            local conf = petsCfg and petsCfg:FindFirstChild(pet.name)
                            local mut = conf and conf:GetAttribute("M") or nil
                            if mut == "Dino" then mut = "Jurassic" end
                            local allowed = true
                            if next(cfgPlaceMuts) ~= nil then
                                if mut then
                                    allowed = (cfgPlaceMuts[tostring(mut)] == true)
                                else
                                    allowed = not requireMut
                                end
                            elseif requireMut then
                                allowed = (mut ~= nil)
                            end
                            if Config.Debug then
                                print("[EnforceMut] pet=", pet.name, "mut=", tostring(mut), "allowed=", allowed)
                            end
                            if not allowed then
                                -- Only act if ALSO matches AutoSell criteria (mutation list and/or speed cut)
                                local cfg2 = readConfig()
                                local doAct = true
                                local scut = tonumber(cfg2.SellPetSpeedBelow) or 0
                                if scut > 0 and (tonumber(pet.speed) or 0) >= scut then doAct = false end
                                local mset = {}
                                for _, mm in ipairs(cfg2.SellPetMutations or {}) do mset[tostring(mm)] = true end
                                if next(mset) ~= nil then
                                    local tag = tostring(mut or "None")
                                    doAct = doAct and (mset[tag] == true)
                                end
                                if doAct then
                                    if pickUpPet(pet.name) then
                                        task.wait(0.1)
                                        if cfg2.AutoSell then sellPet(pet.name) end
                                    end
                                end
                            end
                        end
                    end
                end
            end

            -- 3) Compute average from currently placed pets
            local placed = getPlacedPetsWithSpeeds()
            local avg = averageSpeed(placed)
            if #placed > 0 and avg > 0 then
                local candidates = getInventoryUnplacedCandidates()
                for _, pet in ipairs(placed) do
                    if pet.speed and pet.speed > 0 and pet.speed < avg then
                        -- Skip big pets entirely for pickup/sell logic
                        local isBigPlaced = false
                        do
                            local pg = LocalPlayer and LocalPlayer:FindFirstChild("PlayerGui")
                            local data = pg and pg:FindFirstChild("Data")
                            local petsCfg = data and data:FindFirstChild("Pets")
                            local conf = petsCfg and petsCfg:FindFirstChild(pet.name)
                            if conf then
                                local bpt = conf:GetAttribute("BPT")
                                local bpv = conf:GetAttribute("BPV")
                                if bpt ~= nil or bpv ~= nil then isBigPlaced = true end
                            end
                        end
                        if not isBigPlaced then
							local best = candidates[1]
							if best and best.speed > pet.speed then
                            -- Ensure there is at least one tile available for the type we will deploy
                            local wantWater = isOceanPetByUid(best.uid)
                            local count, tiles = countAvailableTiles(wantWater)
                            if count == 0 then
                                ensureTileForType(wantWater)
                                count, tiles = countAvailableTiles(wantWater)
                            end
                            if pickUpPet(pet.name) then
                                task.wait(0.3)
                                    -- Auto sell by config rules
                                    if cfg.AutoSell then
                                        local doSell = true
                                        local speedCut = tonumber(cfg.SellPetSpeedBelow) or 0
                                        if speedCut > 0 and pet.speed >= speedCut then
                                            doSell = false
                                        end
                                        local delList = cfg.SellPetMutations or {}
                                        if next(delList) ~= nil then
                                            -- read mutation from inventory config; treat nil as "None"
                                            local pg = LocalPlayer and LocalPlayer:FindFirstChild("PlayerGui")
                                            local data = pg and pg:FindFirstChild("Data")
                                            local petsCfg = data and data:FindFirstChild("Pets")
                                            local conf = petsCfg and petsCfg:FindFirstChild(pet.name)
                                            local foundMut = conf and conf:GetAttribute("M") or nil
                                            if foundMut == "Dino" then foundMut = "Jurassic" end
                                            local mutTag = tostring(foundMut or "None")
                                            local wanted = {}
                                            for _, m in ipairs(delList) do wanted[tostring(m)] = true end
                                            doSell = (wanted[mutTag] == true)
                                        end
                                        if doSell then sellPet(pet.name) end
                                    end
                                if cfg.AutoDeploy then
                                    -- try place best candidate
                                    if count > 0 then
                                        local tile = tiles[math.random(1, #tiles)]
                                        placeUnitAtTile(tile, best.uid)
                                        -- remove used candidate from list head
                                        table.remove(candidates, 1)
                                    else
                                        -- If still no tile after ensure, attempt placing an egg to create occupancy
                                        local placedEgg = placeAnyEggForType(wantWater)
                                        if not placedEgg then
                                            if ensureTileForType(wantWater) then
                                                count, tiles = countAvailableTiles(wantWater)
                                                if count > 0 then
                                                    local tile2 = tiles[math.random(1, #tiles)]
                                                    placeUnitAtTile(tile2, best.uid)
                                                    table.remove(candidates, 1)
                                                end
                                            end
                                        end
                                    end
                                end
							end
						end
                        end
                    end
                end
            end
        end
        task.wait(2)
    end
end


-- =====================================================================================
-- Orchestrator
local function start()
	if running then return end
	running = true
	enableFallbackAntiAFK()
	-- Threads
	task.spawn(runAutoBuy)
	task.spawn(runAutoPlace)
	task.spawn(runAutoHatch)
    task.spawn(runAutoClaim)
	task.spawn(runAutoUnlock)
	task.spawn(runAutoUpgrade)
	task.spawn(runAutoFeed)
    task.spawn(runAutoOptimizePets)
    task.spawn(runAutoSellSweep)
    -- Webhook inventory snapshots if configured
    task.spawn(function()
        local cfg = readConfig()
        if not (cfg.WebhookEnabled and cfg.WebhookUrl and cfg.WebhookUrl ~= "") then return end
        -- lazy-load webhook system
        local WebhookSystem = nil
        -- Prefer local WebhookSystem.lua if present
        local okLocal, localMod = pcall(function()
            if readfile then
                local src = readfile("Build a Zoo/WebhookSystem.lua")
                if src and #src > 0 then
                    return loadstring(src)()
                end
            end
            return nil
        end)
        if okLocal and localMod then
            WebhookSystem = localMod
        else
            pcall(function()
                WebhookSystem = loadstring(game:HttpGet("https://raw.githubusercontent.com/ZebuxHub/Main/refs/heads/main/WebhookSystem.lua"))()
            end)
        end
        if not WebhookSystem or not WebhookSystem.InitCore then return end
        pcall(function()
            WebhookSystem.InitCore({ WindUI = nil, Window = nil, Config = nil })
            WebhookSystem.SetWebhookUrl(cfg.WebhookUrl)
        end)
        local interval = tonumber(cfg.WebhookInventoryEverySeconds) or 60
        if interval < 10 then interval = 10 end
        while running and cfg.WebhookEnabled do
            pcall(function()
                if WebhookSystem.SendInventory then
                    WebhookSystem.SendInventory()
                end
            end)
            for i=1,interval do
                if not running then break end
                task.wait(1)
            end
            cfg = readConfig()
        end
    end)

    -- Auto Buy Fruit (separate desired list)
    task.spawn(function()
        while running do
            local cfg = readConfig()
            if not cfg or not cfg.AutoBuyFruit or not FoodStoreRE then task.wait(2) else
                -- Read DesiredFruits only; if empty, do nothing (stop)
                local fruitsWanted = {}
                if type(cfg.DesiredFruits) == "table" then
                    for _, f in ipairs(cfg.DesiredFruits) do fruitsWanted[#fruitsWanted+1] = f end
                end
                if #fruitsWanted == 0 then
                    task.wait(2)
                else
                    -- check store stock and budget, then buy
                local okStore, FruitStore = pcall(function()
                    if readfile then
                        local src = readfile("Build a Zoo/FruitStoreSystem.lua")
                        if src and #src > 0 then return loadstring(src)() end
                    end
                    return nil
                end)
                    if not okStore or not FruitStore then
                        task.wait(2)
                    else
                    -- Ensure we read the live LST from PlayerGui.Data.FoodStore, not only ScreenFoodStore
                    local lst = FruitStore.getFoodStoreLST and FruitStore.getFoodStoreLST() or nil
                        for _, fruitId in ipairs(fruitsWanted) do
                            local inStock = true
                            if lst then
                            inStock = FruitStore.isFruitInStock(fruitId)
                            end
                            if inStock then
                                local candidates = FruitStore.candidateKeysForFruit and FruitStore.candidateKeysForFruit(fruitId) or {fruitId}
                                for _, key in ipairs(candidates) do
                                    pcall(function()
                                        FoodStoreRE:FireServer(key)
                                    end)
                                    task.wait(0.05)
                                end
                            end
                        end
                        task.wait(1.0)
                    end
                end
            end
        end
    end)
end

local function stop()
	running = false
	if antiAFKConnection then antiAFKConnection:Disconnect() antiAFKConnection = nil end
end

-- Auto-start by config
task.spawn(function()
	if Config.Enabled then start() end
	-- Watch for config toggles dynamically
	while true do
		local cfg = readConfig()
		if cfg.Enabled and not running then start() end
		if (not cfg.Enabled) and running then stop() end
		task.wait(1)
	end
end)




