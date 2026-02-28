#!/usr/bin/env ruby
# Benchmark script for CocoaPods xcodeproj gem
# Install: gem install xcodeproj
#
# Usage:
#   ruby xcodeproj.rb <path-to-pbxproj> [iterations]
#   ruby xcodeproj.rb --json <path-to-pbxproj> [iterations]

require 'xcodeproj'
require 'json'

def parse_args
  json_output = false
  args = ARGV.dup

  if args[0] == '--json'
    json_output = true
    args.shift
  end

  file_path = args[0]
  iterations = (args[1] || 100).to_i

  [json_output, file_path, iterations]
end

def run_benchmark(file_path, iterations)
  # Warm-up run
  Xcodeproj::Plist.read_from_path(file_path)

  times = []
  iterations.times do
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    Xcodeproj::Plist.read_from_path(file_path)
    elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - start
    times << elapsed
  end

  avg_ms = (times.sum / times.length) * 1000
  min_ms = times.min * 1000
  max_ms = times.max * 1000

  {
    parser: 'xcodeproj (Ruby)',
    fixture: File.basename(file_path),
    avgMs: avg_ms,
    minMs: min_ms,
    maxMs: max_ms,
    iterations: iterations
  }
end

def main
  json_output, file_path, iterations = parse_args

  unless file_path
    $stderr.puts "Usage: ruby xcodeproj.rb [--json] <path-to-pbxproj> [iterations]"
    exit 1
  end

  unless File.exist?(file_path)
    $stderr.puts "Error: File not found: #{file_path}"
    exit 1
  end

  result = run_benchmark(file_path, iterations)

  if json_output
    puts JSON.pretty_generate(result)
  else
    puts "xcodeproj (Ruby)"
    puts "  file: #{result[:fixture]}"
    puts "  avg: #{result[:avgMs].round(3)}ms"
    puts "  min: #{result[:minMs].round(3)}ms"
    puts "  max: #{result[:maxMs].round(3)}ms"
    puts "  iterations: #{result[:iterations]}"
  end
end

main
