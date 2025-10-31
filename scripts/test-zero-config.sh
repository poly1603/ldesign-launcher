#!/bin/bash

# @ldesign/launcher 零配置功能测试脚本
# 用于验证各框架的自动检测和零配置启动功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 测试框架检测
test_framework_detection() {
    local framework=$1
    local test_dir=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    print_info "测试 ${framework} 框架检测..."
    
    if [ ! -d "$test_dir" ]; then
        print_warning "测试目录不存在: ${test_dir}"
        print_warning "跳过 ${framework} 测试"
        return
    fi
    
    cd "$test_dir"
    
    # 运行框架检测（使用 --dry-run 模式，不实际启动服务器）
    if npx launcher dev --dry-run 2>&1 | grep -q "${framework}"; then
        print_success "${framework} 框架检测成功"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "${framework} 框架检测失败"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    cd - > /dev/null
}

# 测试零配置启动
test_zero_config_start() {
    local framework=$1
    local test_dir=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    print_info "测试 ${framework} 零配置启动..."
    
    if [ ! -d "$test_dir" ]; then
        print_warning "测试目录不存在: ${test_dir}"
        print_warning "跳过 ${framework} 测试"
        return
    fi
    
    cd "$test_dir"
    
    # 检查是否有配置文件
    if [ -f "launcher.config.ts" ] || [ -f "launcher.config.js" ]; then
        print_warning "${framework} 项目存在配置文件，不是纯零配置"
    fi
    
    # 尝试启动（超时 5 秒）
    timeout 5s npx launcher dev --no-open > /dev/null 2>&1 &
    local pid=$!
    
    sleep 3
    
    # 检查进程是否还在运行
    if ps -p $pid > /dev/null; then
        print_success "${framework} 零配置启动成功"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        kill $pid 2>/dev/null || true
    else
        print_error "${framework} 零配置启动失败"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    cd - > /dev/null
}

# 测试构建功能
test_build() {
    local framework=$1
    local test_dir=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    print_info "测试 ${framework} 构建功能..."
    
    if [ ! -d "$test_dir" ]; then
        print_warning "测试目录不存在: ${test_dir}"
        print_warning "跳过 ${framework} 测试"
        return
    fi
    
    cd "$test_dir"
    
    # 运行构建
    if npx launcher build > /dev/null 2>&1; then
        # 检查构建产物
        if [ -d "dist" ] || [ -d "build" ]; then
            print_success "${framework} 构建成功"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            print_error "${framework} 构建失败：未找到构建产物"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        print_error "${framework} 构建失败"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    cd - > /dev/null
}

# 主测试流程
main() {
    print_header "🧪 @ldesign/launcher 零配置功能测试"
    
    print_info "开始测试..."
    echo ""
    
    # 定义测试项目路径（根据实际情况调整）
    EXAMPLES_DIR="../../examples"
    
    # 测试各框架
    print_header "📋 框架检测测试"
    
    test_framework_detection "React" "${EXAMPLES_DIR}/react-demo"
    test_framework_detection "Vue 3" "${EXAMPLES_DIR}/vue3-demo"
    test_framework_detection "Svelte" "${EXAMPLES_DIR}/svelte-demo"
    test_framework_detection "Solid" "${EXAMPLES_DIR}/solid-demo"
    test_framework_detection "Preact" "${EXAMPLES_DIR}/preact-demo"
    test_framework_detection "Qwik" "${EXAMPLES_DIR}/qwik-demo"
    test_framework_detection "Lit" "${EXAMPLES_DIR}/lit-demo"
    test_framework_detection "Angular" "${EXAMPLES_DIR}/angular-demo"
    test_framework_detection "Marko" "${EXAMPLES_DIR}/marko-demo"
    
    print_header "🚀 零配置启动测试"
    
    test_zero_config_start "React" "${EXAMPLES_DIR}/react-demo"
    test_zero_config_start "Vue 3" "${EXAMPLES_DIR}/vue3-demo"
    test_zero_config_start "Svelte" "${EXAMPLES_DIR}/svelte-demo"
    
    print_header "🏗️ 构建功能测试"
    
    test_build "React" "${EXAMPLES_DIR}/react-demo"
    test_build "Vue 3" "${EXAMPLES_DIR}/vue3-demo"
    
    # 打印测试结果
    print_header "📊 测试结果"
    
    echo -e "总测试数: ${TOTAL_TESTS}"
    echo -e "${GREEN}通过: ${PASSED_TESTS}${NC}"
    echo -e "${RED}失败: ${FAILED_TESTS}${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "所有测试通过！🎉"
        exit 0
    else
        print_error "部分测试失败"
        exit 1
    fi
}

# 运行主函数
main


