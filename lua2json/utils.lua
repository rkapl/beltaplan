me = {}
function me.joinpath(...)
    local path = ''
    for i, segment in ipairs({...}) do
        if i == 1 then
            path = segment
        else 
            path = path .. '/' .. segment
        end
    end
    return string.gsub(path, '/+','/')
end

function me.copy_file(from, to)
    local segments = {}
    for segment in  string.gmatch(to, '[^/]+') do
        table.insert(segments, segment)
    end
    local path = '.'
    for i, segment in ipairs(segments) do
        if i ~= #segments then
            path = me.joinpath(path, segment)
            lfs.mkdir(path)
        end
    end
    local fromfile = io.open(from, 'rb')
    local tofile = io.open(to, 'wb')
    tofile:write(fromfile:read("*all"))
    fromfile:close()
    tofile:close()
end

return me
