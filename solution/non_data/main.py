import requests
from typing import List, Dict
from time import sleep

alphabet_list = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

def call_api(url, params=None):
    try:
        # Send a GET request with query parameters
        response = requests.get(url, params=params)
        
        # # Check for successful response
        # response.raise_for_status()
        
        print(f"Status Code: {response.status_code}")
        
        # Attempt to parse response as JSON
        try:
            data = response.json()
        except ValueError:
            raise ValueError(f"response data can not format to json: {response.text}")
        
        print("Response Data:")
        print(data)
        
        return data
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None
    
def call_api_fake(url, params, rs='apple'):
    guess = params['guess']
    res = []
    map_rs = {
        0:"absent",
        1:"correct",
        2:"present",
    }
    for i, c in enumerate(guess):
        ms = 0
        if c == rs[i]:
            ms = 1
        elif c in rs:
            ms = 2
        res.append({
            'slot': i,
            'guess': c,
            'result': map_rs[ms],
        })
    return res
    

def show_result(data:List[Dict]):
    char_arr = [''] * len(data)
    status_arr = [0] * len(data)
    map_rs = {
        "absent":0,
        "correct":1,
        "present":2,
    }
    for di in data:
        char_arr[di["slot"]] = di["guess"]
        status_arr[di["slot"]] = str(map_rs[di["result"]])
    print(char_arr)
    print(status_arr)
    print()
    return char_arr, status_arr

# Example usage with query parameters
if __name__ == "__main__":
    
    api_url = "https://wordle.votee.dev:8000/random"
    size = 5
    call_api(api_url, params={"guess": "arise", "size": size})    
    # # return 
    # list_char_set = []
    # step = len(alphabet_list) // size + 1
    # print(step)
    # # init 5 set character for each index
    # for i in range(size):
    #     rotated = alphabet_list[i*step:i*step+step]
    #     rotated.reverse()
    #     list_char_set.append(rotated)
    # statuses = [0] * size
    # rs = [''] * size
    # prio_queue = set()
    # prio_queue_d = set()
    # count = 0
    # while any(x == '' for x in rs):
    #     # apply priority queue
    #     print(prio_queue)
    #     print(prio_queue_d)
    #     print(rs)
    #     while prio_queue:
    #         t = prio_queue.pop()
    #         for i in range(size):
    #             list_char_set[i].append(t)
    #         prio_queue_d.add(t)
        
    #     # guess new word
    #     new_word = ''
    #     for char_set in list_char_set:
    #         new_word += char_set.pop() if char_set else 'a'
            
    #     # send api to check guess
    #     query_params = {"guess": new_word, "size": size}
    #     result = call_api_fake(api_url, params=query_params)
    #     chars, statuses = show_result(result)
        
    #     # analyze result and remove character incorrect in each index
    #     for i in range(size):
    #         if statuses[i] == '1':
    #             rs[i] = chars[i]
    #             if chars[i] not in prio_queue_d:
    #                 prio_queue.add(chars[i])
    #         elif statuses[i] == '2':
    #             if chars[i] not in prio_queue_d:
    #                 prio_queue.add(chars[i])
    #     count += 1
    #     sleep(0.1)
        
    # print(rs)
    # print(count)
        
        