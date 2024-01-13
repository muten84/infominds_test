using MediatR;

namespace Backend.Features.Customers;


public class CustomerListQuery : IRequest<List<CustomerListQueryResponse>>
{
    public string? Name { get; set; }
    public string? Email { get; set; }

}

public class CustomerListQueryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Address { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Iban{ get; set; } = "";
    public string Code{ get; set; } = "";
    public string Description{ get; set; } = "";

}

internal class CustomerListQueryHandler : IRequestHandler<CustomerListQuery, List<CustomerListQueryResponse>>
{
    private readonly BackendContext context;

    public CustomerListQueryHandler(BackendContext context)
    {
        this.context = context;
    }

    public async Task<List<CustomerListQueryResponse>> Handle(CustomerListQuery request, CancellationToken cancellationToken)
    {
        var query = context.Customers.AsQueryable();
        var query2 = context.CustomerCategories.AsQueryable();

       
        if (!string.IsNullOrEmpty(request.Name))
            query = query.Where(q => q.Name.ToLower().Contains(request.Name.ToLower()));

        if (!string.IsNullOrEmpty(request.Email))
            query = query.Where(q => q.Email.Contains(request.Email));

          var joinResult = query
            .Join(query2, customer => customer.CustomerCategoryId, cat => cat.Id, (customer, cat) => new
            {
                Id = customer.Id,
                Name = customer.Name,
                Address = customer.Address,
                Email = customer.Email,
                Phone = customer.Phone,
                Iban = customer.Iban,
                Code = cat.Code,
                Description = cat.Description
            });

        //tried with left join but sql lite is not supported :-(
        /*
           var risultatoJoin = query
            .GroupJoin(query2, customer => customer.CustomerCategoryId, cat => cat.Id, (customer, cat) => new
            {
                Id = customer.Id,
                Name = customer.Name,
                Address = customer.Address,
                Email = customer.Email,
                Phone = customer.Phone,
                Iban = customer.Iban,
                Categories = cat.DefaultIfEmpty(), // Left join tramite DefaultIfEmpty

            })
             .SelectMany(customer => customer.Categories.Select(cat => new
            {
                Id = customer.Id,
                Name = customer.Name,
                Address = customer.Address,
                Email = customer.Email,
                Phone = customer.Phone,
                Iban = customer.Iban,
                Code = cat.Code,
                Description = cat.Description
            }));
        */

        var data = await joinResult.OrderBy(q => q.Name).ToListAsync(cancellationToken);
        var result = new List<CustomerListQueryResponse>();

        foreach (var item in data)
            result.Add(new CustomerListQueryResponse
            {
                Id = item.Id,
                Name = item.Name,
                Address = item.Address,
                Email = item.Email,
                Phone = item.Phone,
                Iban = item.Iban,
                Code = item.Code,
                Description = item.Description
            });

        return result;
    }
}