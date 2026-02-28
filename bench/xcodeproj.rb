#!/usr/bin/env ruby
# Benchmark script for CocoaPods xcodeproj gem
# Install: gem install xcodeproj
#
# Usage:
#   ruby xcodeproj.rb --level=low <path-to-pbxproj> [iterations]
#   ruby xcodeproj.rb --level=high <path-to-pbxproj> [iterations]
#
# Levels:
#   low  - Parse plist string only (no file I/O in timing, no object model)
#   high - Full Project.open() including file I/O and object model

require 'xcodeproj'
require 'json'

def parse_args
  args = ARGV.dup
  level = 'high'  # default

  # Extract --level argument
  args.reject! do |arg|
    if arg.start_with?('--level=')
      level = arg.split('=')[1]
      true
    else
      false
    end
  end

  file_path = args[0]
  iterations = (args[1] || 100).to_i

  [level, file_path, iterations]
end

def run_low_level_benchmark(file_path, iterations)
  # Pre-read file content (not timed)
  content = File.read(file_path)

  # Warm-up run using Nanaimo (the ASCII plist parser xcodeproj uses)
  require 'nanaimo'
  Nanaimo::Reader.new(content).parse!

  times = []
  iterations.times do
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    # Parse the ASCII plist string - this is the actual parsing work
    Nanaimo::Reader.new(content).parse!
    elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - start
    times << elapsed
  end

  avg_ms = (times.sum / times.length) * 1000
  min_ms = times.min * 1000
  max_ms = times.max * 1000

  {
    parser: 'xcodeproj (Ruby)',
    level: 'low',
    fixture: File.basename(file_path),
    avgMs: avg_ms,
    minMs: min_ms,
    maxMs: max_ms,
    iterations: iterations,
    notes: 'Nanaimo ASCII plist parse (no file I/O)'
  }
end

def run_high_level_benchmark(file_path, iterations)
  # For high-level, we need the .xcodeproj directory, not the .pbxproj file
  # The xcodeproj gem's Project.open expects the .xcodeproj path
  #
  # Since we only have the .pbxproj file, we'll use the lower-level
  # Xcodeproj::Project.new which can work with just the pbxproj data

  # Warm-up run
  Xcodeproj::Plist.read_from_path(file_path)

  times = []
  iterations.times do
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    # This reads and parses the plist file
    # Note: Full Project.open() requires a .xcodeproj directory
    # So we use Plist.read_from_path which is what Project.open uses internally
    Xcodeproj::Plist.read_from_path(file_path)
    elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - start
    times << elapsed
  end

  avg_ms = (times.sum / times.length) * 1000
  min_ms = times.min * 1000
  max_ms = times.max * 1000

  {
    parser: 'xcodeproj (Ruby)',
    level: 'high',
    fixture: File.basename(file_path),
    avgMs: avg_ms,
    minMs: min_ms,
    maxMs: max_ms,
    iterations: iterations,
    notes: 'Plist.read_from_path (includes file I/O)'
  }
end

def main
  level, file_path, iterations = parse_args

  unless file_path
    $stderr.puts "Usage: ruby xcodeproj.rb --level=<low|high> <path-to-pbxproj> [iterations]"
    exit 1
  end

  unless File.exist?(file_path)
    $stderr.puts "Error: File not found: #{file_path}"
    exit 1
  end

  result = if level == 'low'
    run_low_level_benchmark(file_path, iterations)
  else
    run_high_level_benchmark(file_path, iterations)
  end

  # Output in parseable format
  puts "xcodeproj (Ruby) - #{level}-level"
  puts "  file: #{result[:fixture]}"
  puts "  avg: #{result[:avgMs].round(3)}ms"
  puts "  min: #{result[:minMs].round(3)}ms"
  puts "  max: #{result[:maxMs].round(3)}ms"
  puts "  iterations: #{result[:iterations]}"
end

main
