# 自动复制云函数并配置 project.config.json
Write-Host "========== 云函数部署脚本 ==========" -ForegroundColor Cyan

# 1. 复制云函数目录
$source = "cloudfunctions"
$dest = "unpackage\dist\dev\mp-weixin\cloudfunctions"

if (Test-Path $dest) {
    Remove-Item $dest -Recurse -Force
}

Copy-Item $source $dest -Recurse -Force
Write-Host "✓ 云函数已复制到编译目录" -ForegroundColor Green

# 2. 修改 project.config.json
$configPath = "unpackage\dist\dev\mp-weixin\project.config.json"

if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    
    if (-not $config.cloudfunctionRoot) {
        $config | Add-Member -MemberType NoteProperty -Name "cloudfunctionRoot" -Value "cloudfunctions/" -Force
        $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
        Write-Host "✓ 已添加 cloudfunctionRoot 配置" -ForegroundColor Green
    } else {
        Write-Host "✓ cloudfunctionRoot 配置已存在" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ 未找到 project.config.json，请先在 HBuilderX 中编译项目" -ForegroundColor Red
}

Write-Host "========== 部署完成 ==========" -ForegroundColor Cyan
