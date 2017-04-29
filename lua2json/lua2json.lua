local json = require('dkjson')
local lfs = require('lfs')
-- its required by factorio, better check it is present
local serpent = require('serpent')
local utils = require('utils')

-- arguments
local data_dirs = {}
local out_dir = nil
local dump_all = false

local function syntax_error(msg)
    io.stderr:write('lua lua2json.lua [--dump-all] out-dir data-dirs ...\n')
    io.stderr:write(msg)
    os.exit(1)
end

local function filter_table(table, allowed)
    for k,v in pairs(table) do
        if not allowed[k] then
            table[k] = nil
        end
    end 
end

local function is_moddir(moddir)
    local infofile = utils.joinpath(moddir, 'info.json')
    local attr_moddir = lfs.attributes(moddir)
    if attr_moddir == nil then return false end
    if attr_moddir.mode ~= 'directory' then return false end
    return lfs.attributes(infofile) ~= nil
    
end
-- rewrite a path and copy over the resource pointed by that path
local function store_path(mods, path)
    cleanpath = string.gsub(path, '__', '')
    for modname, mod in pairs(mods) do
        path = string.gsub(path, '__' .. modname .. '__', mod.dir)
    end
    utils.copy_file(path, utils.joinpath(out_dir, cleanpath))
    print(cleanpath)
    return cleanpath
end

-- run a given file for all mods
local function run_all(file, mods) 
    for i, mod in pairs(mods) do
        local path = utils.joinpath(mod.dir, file .. '.lua')
        if lfs.attributes(path) ~= nil then
            print('Running '..path)
            dofile(path)
        end
    end
end

-- define the fields we are interested in 
filter_producer = {
    icon = true,
    type = true,
    name = true,
    crafting_speed = true,
    animation = true,
    module_specification = true,
    energy_source = true,
    crafting_categories = true,
    collision_box = true,
    selection_box = true,
    drawing_box = true,
    tile_width = true,
    tile_height = true,
    energy_usage = true,
    allowed_effects = true,
    module_specification = true
}

filter_recipe = {
    enabled = true,
    icon = true,
    name = true,
    type = true,
    results = true,
    ingredients = true,
    category = true,
    energy_required = true,
    normal = true,
    expensive = true
}

filter_item = {
    name = true,
    icon = true,
    icons = true,
    type = true,
    effect = true,
    tier = true,
    limitation = true
}


-- parse arguments
local argindex = 1
while argindex <= #arg do
    local arg = arg[argindex]
    if arg == '--dump-all' then
        dump_all = true
    elseif out_dir == nil then
        out_dir = arg
    else 
        table.insert(data_dirs, arg)
    end
    argindex = argindex + 1
end

if out_dir == nil then
    syntax_error('You have to specify output directory\n')
end

if #data_dirs == 0 then
    syntax_error('You have to specify factorio data directory(ies)\n'
                .. 'For Steam/Linux, try looking into ~/.steam/steam/steamapps/common/Factorio/data/\n')
end

-- find all directories that contain mods
local mods = {}
local core_mod = nil
for i, data_dir in pairs(data_dirs) do
    for mod in lfs.dir(data_dir) do
        local moddir = utils.joinpath(data_dir, mod)       
        if  is_moddir(moddir) then
            print('Found mod ' .. mod)
            local info = io.open(utils.joinpath(data_dir, mod, 'info.json'), "r")
            local jsoninfo = json.decode(info:read("*all"))
            local moddef = {
                name = jsoninfo.name,
                dir = moddir
            }
            info:close()
            mods[moddef.name] = moddef
            if mod == 'core' then
                core_mod = moddef
            end
        end
    end
end

if core_mod == nil then
    io.stderr:write('Core mod not found\n')
    os.exit(1)
end

-- define a new searcher so that require works
-- This should be made in an environment, but a reimplementation of module and requires would 
-- be needed
local function searcher(module)
    for i, mod in pairs(mods) do
        for i, subdir in ipairs({'', 'lualib'}) do
            local modpath = string.gsub(module, '[.]', '/')
            local path = utils.joinpath(mod.dir, subdir, modpath .. '.lua')
            if lfs.attributes(path) ~= nil then
                print('Loading ' ..  path)
                return loadfile(path)
            end
        end
    end
end

-- run factorio data in simulated environment
table.insert(package.searchers, searcher)

print('Initializing Lua environment')
require('dataloader')

defines = {
    difficulty = {
        easy = 1,
        normal = 2,
        hard = 3
    },
    direction = {
        north = 0,
        northeast = 1,
        east = 2,
        southeast = 3,
        south = 4,
        southwest = 5,
        west = 6,
        northwest = 7
    },
    difficulty_settings = {
        recipe_difficulty = {
            normal = 2,
            expensive = 3
        },
        technology_difficulty = {
            normal = 2,
            expensive = 3 
        }
    }
}

run_all('data', mods)
run_all('data-updates', mods)
run_all('data-final-fixes', mods)

data.clear = nil
data.extend = nil

lfs.mkdir(out_dir)

data = data.raw

if dump_all then
    jsondata = io.open(utils.joinpath(out_dir, 'all.json'), 'w')
    jsondata:write(json.encode(data, {indent=true}))
    jsondata:close()
end

-- filter out only the data we are interested in, that is transport belts, recipes
-- and all producers (smelters, assembling machines, refineries)
--  and all items mentioned by them

-- the data that will be written to disk, we will populate it
local filtered = {
    ['transport-belt'] = data['transport-belt'],
    ['recipe'] = data['recipe'],
    ['item'] = {}
}

local wanted_items = {
    ['express-transport-belt'] = true, 
    ['fast-transport-belt'] = true,
    ['basic-transport-belt'] = false,
    ['transport-belt'] = false
}

for name,recipe in pairs(data['recipe']) do
    -- We have to normalize the results and ingredients. So far, three formats 
    -- have been found:
    -- 1) recipe.result = 'item-name' + recipe.result_count (for results only)
    -- 2) recipe.ingredients/results = { {'item-name', 'qty'}}
    -- 3) recipe.ingredients/results = { {name = 'item', amount = 'qty', type = 'fluid/item'}}
    -- All formats will be normalized into the third (by changing the recipe)
    -- Also the location of the results or ingredients might we under difficulty level table

    -- print(serpent.block(recipe))    

    -- further normalize the format and collect the items used we need to to copy to the outfile
    local function normalize2_and_collect(items)
        for i, item in ipairs(items) do
            if not item['name'] then
                items[i] = {name = item[1], amount = item[2], type = 'item'}
            end
            -- print(serpent.block(items[i]))
            wanted_items[items[i]['name']] = true
        end
    end

    local function normalize1(r)
        if r.result then
            local amount = r.amount
            if not amount then
                amount = 1
            end
            r.results = {{name = r.result, amount = amount, type = 'item'}}
        end
        normalize2_and_collect(r.ingredients)
        normalize2_and_collect(r.results)
    end

    if recipe.normal then
        normalize1(recipe.normal)
        normalize1(recipe.expensive)
    else
        normalize1(recipe)
    end
    
    if recipe.icon then
        recipe.icon = store_path(mods, recipe.icon)
    end
    filter_table(recipe, filter_recipe)
end

-- flatten all of the item types into one table

local all_items = {}
local all_producers = {}
local function collect_items(all_items, items_name)
    -- ignore non-existant categories
    if not data[items_name] then
       return
    end
    for k,v in pairs(data[items_name]) do
        all_items[k] = v
    end
end


collect_items(all_items, 'item')
collect_items(all_items, 'deconstruction-item')
collect_items(all_items, 'ammo')
collect_items(all_items, 'gun')
collect_items(all_items, 'armor')
collect_items(all_items, 'mining-tool')
collect_items(all_items, 'module')
collect_items(all_items, 'capsule')
collect_items(all_items, 'fluid')
collect_items(all_items, 'tool')
collect_items(all_items, 'repair-tool')
collect_items(all_items, 'blueprint')
collect_items(all_items, 'blueprint-book')
collect_items(all_items, 'rail-planner')
collect_items(all_items, 'item-with-entity-data')

-- copy over items referenced by recipe, including their icons
for item, b in pairs(wanted_items) do
    local itemdata = all_items[item]
    if itemdata == nil then
        if b then
            -- if the filter is 'false', it is optional
            print("Can not find referenced item: "  .. item)
        end
    else
        local function store_icon(o)
            o.icon = store_path(mods, o.icon)
        end

        if itemdata.icon then
            store_icon(itemdata)
        end

        if itemdata.icons then
            for i, icon in ipairs(itemdata.icons) do
                store_icon(icon)
            end
        end

        filter_table(itemdata, filter_item)
        filtered.item[item] = itemdata
    end
end

collect_items(all_producers, "assembling-machine")
collect_items(all_producers, "furnace")
collect_items(all_producers, "rocket-silo")

for name, producer in pairs(all_producers) do
    producer.icon = store_path(mods, producer.icon)
    if producer.base_day_sprite then
        -- special handling for rocket silo
        producer.animation = producer.base_day_sprite
    end
    -- print('------------------------------------------')
    -- print(serpent.block(producer))

    local function store_anim(a)
        a.filename = store_path(mods, a.filename)
    end

    local function unlayer(a)
        if a.layers then
            return a.layers[1]
        end
        return a    
    end

    -- TODO: use better layer selection than choseing the first one
    producer.animation = unlayer(producer.animation)
    local a = producer.animation
    if a.filename then
        store_anim(a)
    else
        a.north = unlayer(a.north)
        store_anim(a.north)

        a.south = unlayer(a.south)
        store_anim(a.south)

        a.west = unlayer(a.west)
        store_anim(a.west)

        a.east = unlayer(a.east)
        store_anim(a.east)
    end

    filter_table(producer, filter_producer)
end
filtered.producers = all_producers

jsondata = io.open(utils.joinpath(out_dir, 'data.json'), 'w')
jsondata:write(json.encode(filtered, {indent=true}))
jsondata:close()

