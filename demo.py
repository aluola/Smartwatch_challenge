import requests

# 替换为你服务器的公网 IP
# 注意：因为用了 80 端口，这里不需要写 :8000 了
SERVER_IP = "39.107.190.29" 
URL = f"http://{SERVER_IP}/calculate"

def main():
    print(f"正在连接服务器: {URL} ...")
    
    try:
        a = float(input("请输入数字 a: "))
        b = float(input("请输入数字 b: "))
        
        # 发送数据
        payload = {"a": a, "b": b}
        response = requests.post(URL, json=payload, timeout=5)
        
        # 处理结果
        if response.status_code == 200:
            data = response.json()
            print("-" * 30)
            print(f"服务器计算结果: {data['result']}")
            print("-" * 30)
        else:
            print(f"服务器报错: {response.text}")
            
    except Exception as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    while True:
        main()
        if input("继续计算吗? (y/n): ") != 'y':
            break