-- Test Dashboard Integration with Detailed Logging
-- Run this in your Roblox game console to test the connection

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

print("🔧 Starting Dashboard Connection Test...")

-- Test 1: Generate HWID
local function generateTestHWID()
    print("\n📋 Test 1: Generating HWID...")
    
    local success, hwid = pcall(function()
        if gethwid then
            print("   ✅ Using gethwid() function")
            return gethwid()
        elseif getexecutorname then
            print("   ✅ Using getexecutorname() function")
            local executor = getexecutorname() or "Unknown"
            local userId = LocalPlayer and LocalPlayer.UserId or 0
            local randomPart = HttpService:GenerateGUID(false):gsub("-", "")
            return executor .. "_" .. tostring(userId) .. "_" .. randomPart
        else
            print("   ⚠️ Using fallback HWID generation")
            local userId = LocalPlayer and LocalPlayer.UserId or 0
            local randomPart = HttpService:GenerateGUID(false):gsub("-", "")
            return "TEST_" .. tostring(userId) .. "_" .. randomPart
        end
    end)
    
    if success and hwid then
        print("   ✅ HWID Generated:", hwid)
        return hwid
    else
        print("   ❌ HWID Generation Failed:", tostring(hwid))
        return "FAILED_HWID"
    end
end

-- Test 2: Collect game data
local function collectTestData(hwid)
    print("\n📊 Test 2: Collecting Game Data...")
    
    local data = {
        hwid = hwid,
        username = LocalPlayer and LocalPlayer.Name or "Unknown",
        timestamp = os.time(),
        game_id = tostring(game.GameId or "Unknown"),
        place_id = tostring(game.PlaceId or "Unknown"),
        net_worth = 0,
        tickets = 0,
        pets_data = {},
        eggs_data = {},
        fruits_data = {}
    }
    
    -- Try to get attributes
    if LocalPlayer then
        local success, netWorth = pcall(function()
            return LocalPlayer:GetAttribute("NetWorth")
        end)
        if success and netWorth then
            data.net_worth = tonumber(netWorth) or 0
            print("   ✅ Net Worth:", data.net_worth)
        else
            print("   ⚠️ Net Worth not found or error")
        end
        
        local success, tickets = pcall(function()
            return LocalPlayer:GetAttribute("Ticket")
        end)
        if success and tickets then
            data.tickets = tonumber(tickets) or 0
            print("   ✅ Tickets:", data.tickets)
        else
            print("   ⚠️ Tickets not found or error")
        end
    end
    
    print("   📋 Data Summary:")
    print("      Username:", data.username)
    print("      Game ID:", data.game_id)
    print("      Place ID:", data.place_id)
    
    return data
end

-- Test 3: Check backend connection
local function testBackendConnection()
    print("\n🌐 Test 3: Testing Backend Connection...")
    
    local testUrl = "http://localhost:3001/api/test"
    local success, result = pcall(function()
        return HttpService:GetAsync(testUrl)
    end)
    
    if success then
        print("   ✅ Backend is reachable!")
        return true
    else
        print("   ❌ Backend connection failed:", tostring(result))
        print("   💡 Make sure to run: start_backend.bat")
        return false
    end
end

-- Test 4: Send data to dashboard
local function testDataSend(data)
    print("\n📤 Test 4: Sending Data to Dashboard...")
    
    local apiUrl = "http://localhost:3001/api/data"
    local jsonData = HttpService:JSONEncode(data)
    
    print("   📋 Sending JSON:")
    print("   ", jsonData:sub(1, 200) .. (jsonData:len() > 200 and "..." or ""))
    
    local success, result = pcall(function()
        return HttpService:PostAsync(apiUrl, jsonData, Enum.HttpContentType.ApplicationJson)
    end)
    
    if success then
        print("   ✅ Data sent successfully!")
        print("   📋 Response:", tostring(result):sub(1, 100))
        return true
    else
        print("   ❌ Data send failed:", tostring(result))
        return false
    end
end

-- Run all tests
local function runAllTests()
    print("🚀 Running Complete Dashboard Test Suite...")
    print("=" .. string.rep("=", 50))
    
    -- Test 1: HWID
    local hwid = generateTestHWID()
    
    -- Test 2: Data Collection
    local data = collectTestData(hwid)
    
    -- Test 3: Backend Connection
    local backendOk = testBackendConnection()
    
    -- Test 4: Data Send (only if backend is ok)
    local dataSent = false
    if backendOk then
        dataSent = testDataSend(data)
    end
    
    -- Summary
    print("\n" .. string.rep("=", 50))
    print("📋 TEST SUMMARY:")
    print("   HWID Generation:", hwid and "✅ PASS" or "❌ FAIL")
    print("   Data Collection:", data and "✅ PASS" or "❌ FAIL")
    print("   Backend Connection:", backendOk and "✅ PASS" or "❌ FAIL")
    print("   Data Send:", dataSent and "✅ PASS" or "❌ FAIL")
    print(string.rep("=", 50))
    
    if dataSent then
        print("🎉 ALL TESTS PASSED! Dashboard should receive data.")
        print("💡 Your HWID is:", hwid)
        print("💡 Use this HWID to register on the dashboard.")
    else
        print("⚠️ SOME TESTS FAILED. Check the errors above.")
    end
end

-- Run the tests
runAllTests()






