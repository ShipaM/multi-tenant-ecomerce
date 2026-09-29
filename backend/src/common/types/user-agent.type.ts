export interface UserAgentBrowserInfo {
  name?: string;
  version?: string;
  major?: string;
  type?: string;
}

export interface UserAgentCpuInfo {
  architecture?: string;
}

export interface UserAgentDeviceInfo {
  type?: string;
  model?: string;
  vendor?: string;
}

export interface UserAgentEngineInfo {
  name?: string;
  version?: string;
}

export interface UserAgentOsInfo {
  name?: string;
  version?: string;
}

export interface UserAgentInfo {
  ua: string;
  browser: UserAgentBrowserInfo;
  cpu: UserAgentCpuInfo;
  device: UserAgentDeviceInfo;
  engine: UserAgentEngineInfo;
  os: UserAgentOsInfo;
}
