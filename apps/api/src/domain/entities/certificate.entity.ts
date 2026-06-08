export class Certificate {
  constructor(
    public readonly id: string,
    public readonly certificateId: string,
    public readonly studentName: string,
    public readonly courseName: string,
    public readonly issueDate: Date,
    public readonly documentHash: string,
    public readonly transactionHash: string,
    public readonly createdAt: Date,
  ) {}
}
