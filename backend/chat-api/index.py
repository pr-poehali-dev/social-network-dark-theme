import json
import os
from typing import Dict, Any, Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

SCHEMA = 't_p83011699_social_network_dark_'

def get_db_connection():
    '''
    Business: Create database connection
    Args: None
    Returns: Database connection object
    '''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handle chat operations (get messages, send message, create group)
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict with chat data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            action = params.get('action', 'get_messages')
            
            if action == 'get_messages':
                chat_id = params.get('chat_id')
                group_id = params.get('group_id')
                
                if group_id:
                    cursor.execute(
                        f"SELECT * FROM {SCHEMA}.messages WHERE group_id = %s ORDER BY created_at ASC",
                        (int(group_id),)
                    )
                elif chat_id:
                    cursor.execute(
                        f"SELECT * FROM {SCHEMA}.messages WHERE chat_id = %s ORDER BY created_at ASC",
                        (int(chat_id),)
                    )
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id or group_id required'})
                    }
                
                messages = [dict(row) for row in cursor.fetchall()]
                for msg in messages:
                    if isinstance(msg.get('created_at'), datetime):
                        msg['created_at'] = msg['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages})
                }
            
            elif action == 'get_groups':
                user_id = params.get('user_id')
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id required'})
                    }
                
                cursor.execute(f'''
                    SELECT g.* FROM {SCHEMA}.groups g
                    JOIN {SCHEMA}.group_members gm ON g.id = gm.group_id
                    WHERE gm.user_id = %s
                    ORDER BY g.created_at DESC
                ''', (int(user_id),))
                
                groups = [dict(row) for row in cursor.fetchall()]
                for group in groups:
                    if isinstance(group.get('created_at'), datetime):
                        group['created_at'] = group['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'groups': groups})
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'send_message')
            
            if action == 'send_message':
                sender_id = body_data.get('sender_id')
                content = body_data.get('content', '')
                chat_id = body_data.get('chat_id')
                group_id = body_data.get('group_id')
                image_url = body_data.get('image_url')
                audio_url = body_data.get('audio_url')
                audio_duration = body_data.get('audio_duration')
                
                if group_id:
                    cursor.execute(f'''
                        INSERT INTO {SCHEMA}.messages (sender_id, content, group_id, image_url, audio_url)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING *
                    ''', (sender_id, content, group_id, image_url, audio_url))
                elif chat_id:
                    cursor.execute(f'''
                        INSERT INTO {SCHEMA}.messages (sender_id, content, chat_id, image_url, audio_url)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING *
                    ''', (sender_id, content, chat_id, image_url, audio_url))
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id or group_id required'})
                    }
                
                conn.commit()
                message = dict(cursor.fetchone())
                if isinstance(message.get('created_at'), datetime):
                    message['created_at'] = message['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': message})
                }
            
            elif action == 'create_group':
                name = body_data.get('name')
                created_by = body_data.get('created_by')
                members = body_data.get('members', [])
                
                cursor.execute(f'''
                    INSERT INTO {SCHEMA}.groups (name, created_by)
                    VALUES (%s, %s)
                    RETURNING *
                ''', (name, created_by))
                
                group = dict(cursor.fetchone())
                group_id = group['id']
                
                for member_id in members:
                    cursor.execute(f'''
                        INSERT INTO {SCHEMA}.group_members (group_id, user_id)
                        VALUES (%s, %s)
                    ''', (group_id, member_id))
                
                conn.commit()
                
                if isinstance(group.get('created_at'), datetime):
                    group['created_at'] = group['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'group': group})
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            message_id = body_data.get('message_id')
            content = body_data.get('content')
            
            cursor.execute(f'''
                UPDATE {SCHEMA}.messages SET content = %s WHERE id = %s
                RETURNING *
            ''', (content, message_id))
            
            conn.commit()
            message = dict(cursor.fetchone())
            if isinstance(message.get('created_at'), datetime):
                message['created_at'] = message['created_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': message})
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            message_id = params.get('message_id')
            
            cursor.execute(f'UPDATE {SCHEMA}.messages SET content = %s WHERE id = %s', ('Сообщение удалено', int(message_id)))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cursor.close()
        conn.close()