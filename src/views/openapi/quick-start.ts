export const blockApiShell = `curl --location --request POST 'https://localhost:5000/openapi/chat \\
--header 'Authorization: Bearer pat_OYDacMzM3WyOWV3Dtj2bHRMymzxP****' \\
--header 'Content-Type: application/json' \\
--data-raw '{
    "app_id": "734829333445931****",
    "end_user_id": "123456789",
    "conversation_id": "123456789",
    "stream": false,
    "query": "What's the weather like in Guangzhou today"
}'`
export const blockApiOutput = `{
    "code": "success",
    "data": {
        "agent_thoughts": [
            {
                "created_at": 0,
                "event": "long_term_memory_recall",
                "id": "bb3af322-ee05-4914-b678-f9ab0c1100f2",
                "latency": 0,
                "observation": "",
                "thought": "",
                "tool": "",
                "tool_input": {}
            },
            {
                "created_at": 0,
                "event": "agent_thought",
                "id": "3772f55f-f74d-4226-ac6b-262f12e638b3",
                "latency": 10.352535700018052,
                "observation": "",
                "thought": "[{\\"name\\": \\"google_serper\\", \\"args\\": {\\"query\\": \\"2024 Beijing Half Marathon top 3 results\\"}, \\"id\\": \\"chatcmpl-6n0EI9LEUaiONA3rzlNOzLKRI5mFj\\", \\"type\\": \\"tool_call\\"}]",
                "tool": "",
                "tool_input": {}
            },
            {
                "created_at": 0,
                "event": "agent_action",
                "id": "8ccda267-b8b9-407a-b331-e53e13413777",
                "latency": 1.2946343999938108,
                "observation": "\\"After fierce competition, in the men's group, Chinese runner He Jie claimed the championship with a time of 1 hour 03 minutes and 44 seconds. Ethiopian athlete DEJENE HAILU BIKILA, together with Kenya's Robert Keter and WILLY MNANGAT, tied for the second place with a time of 1 hour 03 minutes and 45 seconds. Chinese runner Li Chunhui took the third place with a time of 1 hour 06 minutes and 58 seconds.\\"",
                "thought": "",
                "tool": "google_serper",
                "tool_input": {
                    "query": "2024 Beijing Half Marathon top 3 results"
                }
            },
            {
                "created_at": 0,
                "event": "agent_message",
                "id": "2838d7e4-a368-4340-88d4-009245d895a1",
                "latency": 4.272923699987587,
                "observation": "",
                "thought": "In the 2024 Beijing Half Marathon, the top 3 results are as follows:\\n\\n1. Men's Champion: Athlete from China, finishing time 1 hour 3 minutes and 44 seconds.\\n2. Men's Runner-up: Dejene Hailu Bikila from Ethiopia, finishing time 1 hour 3 minutes and 45 seconds.\\n3. Men's Third Place: Robert Keter from Kenya, finishing time 1 hour 3 minutes and 46 seconds.\\n\\nFor the women's group, the champion is Chinese athlete Li Chunxia with a time of 1 hour 6 minutes and 58 seconds.",
                "tool": "",
                "tool_input": {}
            },
            {
                "created_at": 0,
                "event": "agent_end",
                "id": "1b963062-8623-4e6e-a65e-16249d1c1ee8",
                "latency": 0,
                "observation": "",
                "thought": "",
                "tool": "",
                "tool_input": {}
            }
        ],
        "answer": "In the 2024 Beijing Half Marathon, the top 3 results are as follows:\\n\\n1. Men's Champion: Athlete from China, finishing time 1 hour 3 minutes and 44 seconds.\\n2. Men's Runner-up: Dejene Hailu Bikila from Ethiopia, finishing time 1 hour 3 minutes and 45 seconds.\\n3. Men's Third Place: Robert Keter from Kenya, finishing time 1 hour 3 minutes and 46 seconds.\\n\\nFor the women's group, the champion is Chinese athlete Li Chunxia with a time of 1 hour 6 minutes and 58 seconds.",
        "conversation_id": "11356d51-7047-4668-9a7a-5fb6eb27e032",
        "end_user_id": "c63840ec-3362-4525-8fb3-eb99fded09c2",
        "id": "9ada9487-2274-4003-820b-b57997229ac8",
        "latency": 15.92009379999945,
        "query": "Help me check the top 3 results of the 2024 Beijing Half Marathon",
        "total_token_count": 0
    },
    "message": ""
}`
export const streamApiShell = `curl --location --request POST 'https://localhost:5000/openapi/chat \\
--header 'Authorization: Bearer pat_OYDacMzM3WyOWV3Dtj2bHRMymzxP****' \\
--header 'Content-Type: application/json' \\
--data-raw '{
    "app_id": "734829333445931****",
    "end_user_id": "123456789",
    "conversation_id": "123456789",
    "stream": true,
    "query": "What's the weather like in Guangzhou today"
}'`
export const streamApiOutput = `event: long_term_memory_recall
data:{"event": "long_term_memory_recall", "thought": "", "observation": "", "tool": "", "tool_input": {}, "answer": "", "latency": 0, "id": "8bfc7813-6a0b-4e40-8505-65a5d9ddeadc", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
event: agent_thought
data:{"event": "agent_thought", "thought": "[{\\"name\\": \\"google_serper\\", \\"args\\": {\\"query\\": \\"2024 Beijing Half Marathon top 3 results\\"}, \\"id\\": \\"chatcmpl-ZkqMmN4decBOYyCcxYMOSe7LjYI1K\\", \\"type\\": \\"tool_call\\"}]", "observation": "", "tool": "", "tool_input": {}, "answer": "", "latency": 7.987706799991429, "id": "234b3b12-4b29-416d-847f-0c23f21715d3", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
event: agent_action
data:{"event": "agent_action", "thought": "", "observation": "\\"After fierce competition, in the men's group, Chinese runner He Jie claimed the championship with a time of 1 hour 03 minutes and 44 seconds. Ethiopian athlete DEJENE HAILU BIKILA, together with Kenya's Robert Keter and WILLY MNANGAT, tied for the second place with a time of 1 hour 03 minutes and 45 seconds. Chinese runner Li Chunhui took the third place with a time of 1 hour 06 minutes and 58 seconds.\\"", "tool": "google_serper", "tool_input": {"query": "2024 Beijing Half Marathon top 3 results"}, "answer": "", "latency": 1.018759400001727, "id": "42aa6d10-b9f0-46b8-84d4-c73753d2d716", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
event: ping
data:{"event": "ping", "thought": "", "observation": "", "tool": "", "tool_input": {}, "answer": "", "latency": 0, "id": "18f79eab-9025-4b1b-94a3-75ea42fa7029", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
event: agent_message
data:{"event": "agent_message", "thought": "202", "observation": "", "tool": "", "tool_input": {}, "answer": "202", "latency": 5.723647899983916, "id": "0d290337-3b10-4d2a-88c4-72891ca8ebd4", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
event: agent_message
data:{"event": "agent_message", "thought": "4", "observation": "", "tool": "", "tool_input": {}, "answer": "4", "latency": 5.72700110002188, "id": "0d290337-3b10-4d2a-88c4-72891ca8ebd4", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
event: agent_message
data:{"event": "agent_message", "thought": " ", "observation": "", "tool": "", "tool_input": {}, "answer": " ", "latency": 5.735950900008902, "id": "0d290337-3b10-4d2a-88c4-72891ca8ebd4", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
event: agent_message
data:{"event": "agent_message", "thought": ".", "observation": "", "tool": "", "tool_input": {}, "answer": ".", "latency": 6.779141300008632, "id": "0d290337-3b10-4d2a-88c4-72891ca8ebd4", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
event: agent_message
data:{"event": "agent_message", "thought": "", "observation": "", "tool": "", "tool_input": {}, "answer": "", "latency": 6.779683900007512, "id": "0d290337-3b10-4d2a-88c4-72891ca8ebd4", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
event: agent_end
data:{"event": "agent_end", "thought": "", "observation": "", "tool": "", "tool_input": {}, "answer": "", "latency": 0, "id": "020deae7-6307-4e39-8378-bfdaa11e0f0d", "end_user_id": "d010ddef-181d-4c04-9d29-edd60c9c0da8", "conversation_id": "76cf52b8-36b7-4fd5-af8b-65547991f84a", "message_id": "ed221e86-4d8f-43b0-8d35-a70fbbc7b0b3", "task_id": "03042ead-23d6-42c6-a5c9-caac416bb80c"}
`
