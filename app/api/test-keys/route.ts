import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Test with anon key (should respect RLS)
const supabaseAnon = createClient(
  supabaseUrl, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Test with service role key (should bypass RLS)
const supabaseService = supabaseAdmin;

export async function GET(request: NextRequest) {
  try {
    console.log('🔑 Testing Supabase key configuration...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Anon key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Test 1: Basic connection with anon key
    console.log('\n📡 Testing anon key connection...');
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('games')
      .select('id, status')
      .limit(3);

    console.log('Anon key result:', { data: anonData, error: anonError });

    // Test 2: Basic connection with service role key
    console.log('\n🔧 Testing service role key connection...');
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('games')
      .select('id, status')
      .limit(3);

    console.log('Service role key result:', { data: serviceData, error: serviceError });

    // Test 3: Test RLS policies with anon key (should be restricted)
    console.log('\n🚫 Testing RLS restrictions with anon key...');
    const { data: anonWriteData, error: anonWriteError } = await supabaseAnon
      .from('players')
      .update({ nickname: 'TEST_UPDATE' })
      .eq('id', '8a5dfe1a-63df-44eb-b7c9-4f3477120e2d') // Use a valid UUID
      .select();

    console.log('Anon key write attempt:', { data: anonWriteData, error: anonWriteError });

    // Test 4: Test bypassing RLS with service role key (should work)
    console.log('\n✅ Testing RLS bypass with service role key...');
    const { data: serviceWriteData, error: serviceWriteError } = await supabaseService
      .from('players')
      .update({ nickname: 'TEST_UPDATE' })
      .eq('id', '8a5dfe1a-63df-44eb-b7c9-4f3477120e2d') // Use a valid UUID
      .select();

    console.log('Service role key write attempt:', { data: serviceWriteData, error: serviceWriteError });

    // Test 5: Check if RLS is actually enabled on players table
    console.log('\n🔍 Checking RLS status on players table...');
    const { data: rlsStatus, error: rlsError } = await supabaseService
      .rpc('get_rls_status', { table_name: 'players' })
      .single();

    console.log('RLS status check:', { data: rlsStatus, error: rlsError });

    // Test 6: Try to insert a new player with anon key (should be blocked)
    console.log('\n🚫 Testing anon key insert (should be blocked by RLS)...');
    const { data: anonInsertData, error: anonInsertError } = await supabaseAnon
      .from('players')
      .insert({ 
        name: 'TEST_PLAYER_ANON',
        nickname: 'TEST_ANON',
        email: 'test@example.com'
      })
      .select();

    console.log('Anon key insert attempt:', { data: anonInsertData, error: anonInsertError });

    // Test 7: Try to insert a new player with service role key (should work)
    console.log('\n✅ Testing service role key insert (should work)...');
    const { data: serviceInsertData, error: serviceInsertError } = await supabaseService
      .from('players')
      .insert({ 
        name: 'TEST_PLAYER_SERVICE',
        nickname: 'TEST_SERVICE',
        email: 'test-service@example.com'
      })
      .select();

    console.log('Service role key insert attempt:', { data: serviceInsertData, error: serviceInsertError });

    // Test 5: Check current environment configuration
    const currentKey = process.env.NODE_ENV === 'development' 
      ? 'SUPABASE_SERVICE_ROLE_KEY' 
      : 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

    console.log('\n🎯 Current environment configuration:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Using key:', currentKey);
    console.log('Key present:', !!process.env[currentKey]);

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      currentKey,
      keyPresent: !!process.env[currentKey],
      tests: {
        anonKey: {
          read: { success: !anonError, data: anonData, error: anonError },
          write: { success: !anonWriteError, data: anonWriteData, error: anonWriteError }
        },
        serviceRoleKey: {
          read: { success: !serviceError, data: serviceData, error: serviceError },
          write: { success: !serviceWriteError, data: serviceWriteData, error: serviceWriteError }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error testing keys:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 